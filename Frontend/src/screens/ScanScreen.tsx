import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native-web';
import { useApp, type CapturedMeal } from '../context/AppContext';
import { Row, Txt, IconBox, Pill, c } from '../ui';
import { analyzeFoodImage, type VisionRecognitionResult } from '../services/visionService';

interface ScanScreenProps { onNavigate: (screen: string) => void }
interface Snapshot { dataUrl: string; blob: Blob }
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.75;
const TAGS = ['Half rice', 'Less rice', 'Extra rice', 'Less oil / gravy', 'Extra sambal / sauce', 'Deep-fried', 'Steamed / Soup'];

const Corner = ({ style }: { style?: object }) => <View style={[{ position: 'absolute', width: 44, height: 44, borderColor: '#fff', borderWidth: 3.5, borderRadius: 16, zIndex: 9, pointerEvents: 'none' as const }, style]} />;

function freezeFrame(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the photo for analysis.');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((response) => response.blob());
}

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image file.')); };
    image.src = url;
  });
}

function toCapturedMeal(result: VisionRecognitionResult, dataUrl: string, blob: Blob): CapturedMeal {
  const items = result.items;
  return { name: result.meal_title || items[0]?.name || 'Detected meal', kcal: result.total_calories,
    protein: items.reduce((sum, item) => sum + item.protein_g, 0), carbs: items.reduce((sum, item) => sum + item.carbs_g, 0),
    fat: items.reduce((sum, item) => sum + item.fat_g, 0), image: dataUrl, imageFile: blob, visionResult: result };
}

export default function ScanScreen({ onNavigate }: ScanScreenProps) {
  const { showToast, setCapturedMeal } = useApp();
  const [flashOn, setFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
  };

  useEffect(() => {
    let cancelled = false;
    const startCamera = async () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraError(null); setCameraActive(false);
      if (!navigator?.mediaDevices?.getUserMedia) { setCameraError('Camera API is not supported on this browser. Use Gallery to upload a photo.'); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing }, audio: false });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) { video.srcObject = stream; await video.play().catch((error) => console.warn('Video play failed:', error)); }
        setCameraActive(true);
      } catch (error) {
        console.error('Camera start failed:', error);
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : '';
        setCameraError(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'Camera permission denied. Use Gallery to upload a photo.' : 'Could not start the camera. Use Gallery to upload a photo.');
        setCameraActive(false);
      }
    };
    void startCamera();
    return () => { cancelled = true; stopStream(); if (progressTimerRef.current !== null) window.clearInterval(progressTimerRef.current); };
  }, [cameraFacing]);

  const publishRecognition = (result: VisionRecognitionResult, dataUrl: string, blob: Blob) => {
    setCapturedMeal(toCapturedMeal(result, dataUrl, blob));
    stopStream();
    onNavigate('Scan Result');
  };

  const recognize = async () => {
    if (!snapshot || isProcessing) return;
    setScanError(null); setIsProcessing(true); setProgress(0);
    showToast('Analyzing your photo...');
    // Reach 95% over roughly 27 seconds, then hold there until Gemini responds.
    progressTimerRef.current = window.setInterval(() => setProgress((current) => Math.min(95, current + 95 / 270)), 100);
    try {
      const result = await analyzeFoodImage(snapshot.dataUrl, { description, tags: selectedTags });
      if (progressTimerRef.current !== null) window.clearInterval(progressTimerRef.current);
      setProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      setIsProcessing(false);
      publishRecognition(result, snapshot.dataUrl, snapshot.blob);
    } catch (error) {
      if (progressTimerRef.current !== null) window.clearInterval(progressTimerRef.current);
      console.error('Scan analysis failed:', error);
      const message = error instanceof Error ? error.message : 'Food recognition failed.';
      setScanError(message); setIsProcessing(false); setProgress(0); showToast(message);
    }
  };

  const setFrozenSnapshot = async (dataUrl: string) => {
    // The data URL is set immediately; blob preparation is deferred until after the view freezes.
    setCapturedUrl(dataUrl);
    setScanError(null); setDescription(''); setSelectedTags([]);
    if (videoRef.current) videoRef.current.pause();
    const blob = await dataUrlToBlob(dataUrl);
    setSnapshot({ dataUrl, blob });
  };

  const handleSnap = () => {
    const video = videoRef.current;
    if (isProcessing || snapshot) return;
    if (!video || !cameraActive || !video.videoWidth || !video.videoHeight) {
      const message = 'The camera does not have a frame yet. Wait a moment, or upload a photo.';
      setScanError(message); showToast(message); return;
    }
    try {
      // Capture synchronously in the click handler, before any await or state-driven delay.
      const dataUrl = freezeFrame(video, video.videoWidth, video.videoHeight);
      void setFrozenSnapshot(dataUrl).catch((error) => {
        const message = error instanceof Error ? error.message : 'Could not prepare the captured photo.';
        setScanError(message); setCapturedUrl(null); showToast(message);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not capture a photo.';
      setScanError(message); showToast(message);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || isProcessing) return;
    try {
      const image = await loadImageFile(file);
      // Once the selected image is decoded, freeze it synchronously before other async work.
      const dataUrl = freezeFrame(image, image.naturalWidth, image.naturalHeight);
      await setFrozenSnapshot(dataUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not prepare that photo.';
      setScanError(message); showToast(message);
    }
  };

  const retake = () => {
    if (isProcessing) return;
    setSnapshot(null); setCapturedUrl(null); setScanError(null); setProgress(0);
    if (videoRef.current && streamRef.current) void videoRef.current.play().catch(() => undefined);
  };

  const status = progress === 100 ? 'Complete!' : progress <= 25 ? 'Preparing snapshot...' : progress <= 60 ? 'Scanning image for food & drinks...' : progress <= 85 ? 'Estimating portions, sauces & calories...' : 'Finalizing AI verification...';
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' };

  return <View style={{ flex: 1, backgroundColor: '#2d3748', position: 'relative', minHeight: '100vh', overflowY: 'auto' as const }}>
    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
    <Row style={{ justifyContent: 'space-between', padding: 20, paddingTop: 40, alignItems: 'center' }}>
      <IconBox label="✕" onPress={() => { stopStream(); onNavigate('Home'); }} />
      <Pill bg={c.yellow}>AI Vision Meal Scanner</Pill>
      <IconBox label={flashOn ? '⚡' : 'flash'} onPress={() => { setFlashOn(!flashOn); showToast(flashOn ? 'Flash off' : 'Flash enabled'); }} />
    </Row>

    <View style={{ height: 380, width: '100%', maxWidth: 540, alignSelf: 'center', marginVertical: 16, position: 'relative', borderRadius: 24, overflow: 'hidden', backgroundColor: '#1a202c', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#1a202c', visibility: capturedUrl ? 'hidden' : 'visible' }} />
      {capturedUrl && <img src={capturedUrl} alt="Captured meal snapshot" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      {!cameraActive && !capturedUrl && <View style={{ paddingHorizontal: 28, alignItems: 'center' }}><Txt s={16} w="700" color="#fff" style={{ textAlign: 'center' }}>Camera preview unavailable</Txt><Txt s={12} color="#cbd5e1" style={{ marginTop: 8, textAlign: 'center' }}>{cameraError || 'Allow camera access, or use Gallery to choose a photo.'}</Txt></View>}
      <Corner style={{ top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0 }} /><Corner style={{ top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0 }} /><Corner style={{ bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0 }} /><Corner style={{ bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0 }} />
      {isProcessing && <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.76)', alignItems: 'center', justifyContent: 'center', zIndex: 14, padding: 24 }}>
        <Txt s={30} w="800" color="#fff">{Math.floor(progress)}%</Txt><Txt s={14} w="700" color="#fff" style={{ marginTop: 8 }}>{status}</Txt>
        <View style={{ width: '100%', maxWidth: 340, height: 12, marginTop: 18, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.25)' }}><View style={{ width: `${progress}%`, height: '100%', borderRadius: 999, backgroundColor: c.yellow, transition: 'width 120ms linear' }} /></View>
        <ActivityIndicator color={c.yellow} size="small" style={{ marginTop: 14 }} />
      </View>}
    </View>

    {capturedUrl && snapshot && !isProcessing && <View style={{ width: '100%', maxWidth: 540, alignSelf: 'center', padding: 16, borderRadius: 18, backgroundColor: c.card, marginBottom: 14 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><Txt s={16} w="800">Add meal details</Txt><Pressable onPress={retake} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#e2e8f0' }}><Txt s={13} w="700">Retake</Txt></Pressable></Row>
      <input aria-label="Describe your meal (optional)" placeholder="Describe your meal (optional, e.g., Nasi Lemak Ayam Goreng)" value={description} onChange={(event) => setDescription(event.target.value)} style={inputStyle} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>{TAGS.map((tag) => { const active = selectedTags.includes(tag); return <Pressable key={tag} onPress={() => setSelectedTags((current) => active ? current.filter((item) => item !== tag) : [...current, tag])} style={{ paddingVertical: 7, paddingHorizontal: 9, borderRadius: 999, backgroundColor: active ? c.yellow : '#edf2f7', borderWidth: 1, borderColor: active ? '#d69e00' : '#e2e8f0' }}><Txt s={11} w={active ? '700' : '500'}>{tag}</Txt></Pressable>; })}</View>
      <Pressable onPress={() => void recognize()} style={{ alignItems: 'center', padding: 12, marginTop: 10, borderRadius: 12, backgroundColor: c.yellow }}><Txt s={15} w="800">Analyze Meal</Txt></Pressable>
    </View>}

    <View style={{ alignItems: 'center', paddingHorizontal: 20 }}><Txt s={20} w="800" color="#fff">Good food. Great focus.</Txt><Txt s={12} color="#cbd5e1" style={{ marginTop: 4, textAlign: 'center' }}>{capturedUrl ? 'Snapshot frozen. Add optional details, then analyze your meal.' : cameraActive ? 'Camera active. Frame your plate and tap the shutter.' : cameraError || 'Align your plate within the frame, or upload a photo from Gallery.'}</Txt>
      {scanError ? <View style={{ marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FDE8E8', maxWidth: 460 }}><Txt s={13} color="#7f1d1d" style={{ textAlign: 'center' }}>{scanError}</Txt></View> : null}</View>

    {!capturedUrl && <Row style={{ justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 36, marginTop: 24, marginBottom: 36 }}>
      <Pressable onPress={() => fileInputRef.current?.click()} disabled={isProcessing} style={{ alignItems: 'center', cursor: 'pointer' as const }}><IconBox size={50} label="img" /><Txt s={11} color="#fff" style={{ marginTop: 4 }}>Gallery</Txt></Pressable>
      <Pressable onPress={handleSnap} disabled={isProcessing} style={({ pressed }: { pressed: boolean }) => [{ width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as const, transform: [{ scale: pressed ? 0.95 : 1 }] }]}><View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.yellow }} /></Pressable>
      <Pressable onPress={() => { if (!isProcessing) { setCameraFacing((facing) => facing === 'environment' ? 'user' : 'environment'); showToast('Switched camera'); } }} style={{ alignItems: 'center', cursor: 'pointer' as const }}><IconBox size={50} label="flip" /><Txt s={11} color="#fff" style={{ marginTop: 4 }}>Flip</Txt></Pressable>
    </Row>}
  </View>;
}
