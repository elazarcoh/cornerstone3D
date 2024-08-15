import type {
  LabelmapSegmentationData,
  LabelmapSegmentationDataVolume,
} from '../../../../types/LabelmapTypes';
import type {
  LabelmapToolOperationData,
  LabelmapToolOperationDataStack,
  LabelmapToolOperationDataVolume,
} from '../../../../types';
import type { Types } from '@cornerstonejs/core';
import { VolumeViewport } from '@cornerstonejs/core';

function isVolumeSegmentation(
  operationData: LabelmapToolOperationData | LabelmapSegmentationData,
  viewport?: Types.IViewport
): operationData is
  | LabelmapToolOperationDataVolume
  | LabelmapSegmentationDataVolume {
  const { imageIds } = operationData as LabelmapToolOperationDataStack;
  const { volumeId } = operationData as LabelmapToolOperationDataVolume;

  if (volumeId && !imageIds) {
    return true;
  }

  if (imageIds && !volumeId) {
    return false;
  }

  // we can get the viewport to decide
  return viewport instanceof VolumeViewport;
}

export { isVolumeSegmentation };
