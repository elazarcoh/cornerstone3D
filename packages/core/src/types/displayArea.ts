type DisplayArea = {
  rotation?: number;
  flipHorizontal?: boolean;
  imageArea: [number, number]; // areaX, areaY
  imageCanvasPoint: {
    imagePoint: [number, number]; // imageX, imageY
    canvasPoint: [number, number]; // canvasX, canvasY
  };
  storeAsInitialCamera: boolean;
};

export default DisplayArea;
