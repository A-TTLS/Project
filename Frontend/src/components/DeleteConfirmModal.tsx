import React, { useState } from 'react';
import { View, Pressable } from 'react-native-web';
import { type MealItem } from '../context/AppContext';
import { Row, Txt, Btn, Icon, c } from '../ui';

interface DeleteConfirmModalProps {
  meal: MealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean | void>;
}

export function DeleteConfirmModal({ meal, isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  if (!isOpen || !meal) return null;

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(meal.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View
      style={{
        position: 'fixed' as any,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 380,
          backgroundColor: c.card,
          borderRadius: 22,
          padding: 22,
          gap: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Warning Icon Badge */}
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Icon name="trash" size={24} color="#DC2626" />
          </View>

          <Txt s={18} w="800" style={{ textAlign: 'center' }}>
            Delete Meal Entry?
          </Txt>

          <Txt s={13} color={c.mute} style={{ textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
            Are you sure you want to remove <Txt s={13} w="700" color={c.ink}>"{meal.name}"</Txt> ({meal.kcal} kcal)?
          </Txt>

          <Txt s={11} color="#9CA3AF" style={{ textAlign: 'center', marginTop: 4 }}>
            This will immediately update your daily calorie and macro totals.
          </Txt>
        </View>

        {/* Action Buttons */}
        <Row style={{ gap: 10, marginTop: 8 }}>
          <Pressable
            onPress={onClose}
            disabled={isDeleting}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.line,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
            }}
          >
            <Txt s={13} w="700" color={c.mute}>Keep Entry</Txt>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#DC2626',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            <Txt s={13} w="700" color="#FFFFFF">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Txt>
          </Pressable>
        </Row>
      </View>
    </View>
  );
}
