import React from "react";
import { Platform, ViewStyle } from "react-native";
import { WebCropper } from "./WebCropper";
import { MobileCropper } from "./MobileCropper";

export interface CropperProps {
  imageUri: string;
  onCropConfirm: (croppedImageUri: string) => void;
  onCancel: () => void;
  style?: ViewStyle;
}

export function Cropper(props: CropperProps) {
  return Platform.OS === "web" ? <WebCropper {...props} /> : <MobileCropper {...props} />;
}
