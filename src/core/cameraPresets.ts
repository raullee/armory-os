import type { CameraPreset, CameraPresetId } from '@/firearm/schema';

/**
 * Camera presets are expressed in the firearm frame (+x muzzle, +y up, +z right)
 * as a direction from the target to the camera and a distance multiplier on
 * the model's framing distance.
 */
export const CAMERA_PRESETS: Record<CameraPresetId, CameraPreset> = {
  'three-quarter': { id: 'three-quarter', label: 'Three-quarter', direction: [0.58, 0.3, 0.76], distance: 1.0 },
  side: { id: 'side', label: 'Side', direction: [0, 0.02, 1], distance: 1.0 },
  'side-left': { id: 'side-left', label: 'Left side', direction: [0, 0.02, -1], distance: 1.0 },
  top: { id: 'top', label: 'Top', direction: [0.0001, 1, 0.0001], distance: 1.0 },
  front: { id: 'front', label: 'Front', direction: [1, 0.08, 0.001], distance: 0.9 },
  rear: { id: 'rear', label: 'Rear', direction: [-1, 0.08, 0.001], distance: 0.9 },
  iso: { id: 'iso', label: 'Isometric', direction: [0.577, 0.577, 0.577], distance: 1.05 },
  'detail-action': { id: 'detail-action', label: 'Action detail', direction: [0.3, 0.42, 0.86], distance: 0.42, target: [-60, 0, 0] },
  'detail-muzzle': { id: 'detail-muzzle', label: 'Muzzle detail', direction: [0.85, 0.25, 0.47], distance: 0.4 },
  'detail-grip': { id: 'detail-grip', label: 'Grip detail', direction: [-0.35, -0.1, 0.93], distance: 0.45 },
};

export const PRESET_ORDER: CameraPresetId[] = ['three-quarter', 'side', 'top', 'front', 'iso'];
