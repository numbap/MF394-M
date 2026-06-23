import React, { useRef } from "react";
import { PanResponder, GestureResponderEvent } from "react-native";

interface GestureRefs {
  zoomRef: React.MutableRefObject<number>;
  minZoomRef: React.MutableRefObject<number>;
  offsetXRef: React.MutableRefObject<number>;
  offsetYRef: React.MutableRefObject<number>;
  imageDimensionsRef: React.MutableRefObject<{ width: number; height: number }>;
  canvasSizeRef: React.MutableRefObject<number>;
  setZoom: (v: number) => void;
  setOffsetX: (v: number) => void;
  setOffsetY: (v: number) => void;
}

function getTouchDistance(touches: any[]): number {
  const [touch1, touch2] = touches;
  const dx = touch1.pageX - touch2.pageX;
  const dy = touch1.pageY - touch2.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function useMobileCropperGestures(refs: GestureRefs) {
  const {
    zoomRef,
    minZoomRef,
    offsetXRef,
    offsetYRef,
    imageDimensionsRef,
    canvasSizeRef,
    setZoom,
    setOffsetX,
    setOffsetY,
  } = refs;

  const initialDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(1);
  const panStartX = useRef(0);
  const panStartY = useRef(0);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (evt.nativeEvent.touches.length === 2) {
          initialDistance.current = getTouchDistance(evt.nativeEvent.touches);
          initialZoom.current = zoomRef.current;
        } else {
          panStartX.current = offsetXRef.current;
          panStartY.current = offsetYRef.current;
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: any) => {
        if (evt.nativeEvent.touches.length === 2) {
          const currentDistance = getTouchDistance(evt.nativeEvent.touches);
          if (initialDistance.current) {
            const scale = currentDistance / initialDistance.current;
            const newZoom = initialZoom.current * scale;
            const clampedZoom = Math.max(minZoomRef.current, Math.min(3, newZoom));
            setZoom(clampedZoom);
          }
        } else {
          const newOffsetX = panStartX.current + gestureState.dx;
          const newOffsetY = panStartY.current + gestureState.dy;

          const maxOffsetX =
            (imageDimensionsRef.current.width * zoomRef.current - canvasSizeRef.current) / 2;
          const maxOffsetY =
            (imageDimensionsRef.current.height * zoomRef.current - canvasSizeRef.current) / 2;

          const clampedX =
            maxOffsetX > 0 ? Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX)) : 0;
          const clampedY =
            maxOffsetY > 0 ? Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY)) : 0;

          setOffsetX(clampedX);
          setOffsetY(clampedY);
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = null;
      },
    })
  ).current;

  return panResponder;
}
