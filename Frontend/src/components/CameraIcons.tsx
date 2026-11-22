import React from 'react';

export function BackArrowIcon({ color = '#FDE68A' }: { color?: string }) {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="m14.5 5-7 7 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface CameraFrameIconProps {
  frameColor?: string;
  arrowColor?: string;
}

export function FlipCameraIcon({ frameColor = '#FAF8F2', arrowColor = '#FDE68A' }: CameraFrameIconProps) {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2.25" y="2.25" width="19.5" height="19.5" rx="5" stroke={frameColor} strokeWidth="2" />
      <path d="M7.1 10a5.2 5.2 0 0 1 8.7-2l1 1M16.8 9V6.2M16.8 9H14" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.9 14a5.2 5.2 0 0 1-8.7 2l-1-1M7.2 15v2.8M7.2 15H10" stroke={frameColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RetakeCameraIcon(props: CameraFrameIconProps) {
  return <FlipCameraIcon {...props} />;
}

export function GalleryFoodIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2.25" y="2.25" width="19.5" height="19.5" rx="5" stroke="#FAF8F2" strokeWidth="2" />
      <path d="M9 9c-.9-.8.9-1.3 0-2.2M14 9c-.9-.8.9-1.3 0-2.2" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.5 11.2h11l-1.3 4.3H7.8l-1.3-4.3Z" fill="#FDE68A" fillOpacity=".18" stroke="#FDE68A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 17.4h8M9.2 13.4h.01M12 13.4h.01M14.8 13.4h.01" stroke="#FAF8F2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
