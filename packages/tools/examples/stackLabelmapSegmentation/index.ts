import { Enums, RenderingEngine, imageLoader } from '@cornerstonejs/core';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  createImageIdsAndCacheMetaData,
  initDemo,
  addDropdownToToolbar,
  setTitleAndDescription,
  addButtonToToolbar,
  addBrushSizeSlider,
} from '../../../../utils/demo/helpers';
import { fillStackSegmentationWithMockData } from '../../../../utils/test/testUtils';

// This is for debugging purposes
console.warn(
  'Click on index.ts to open source code for this example --------->'
);

const {
  ToolGroupManager,
  ZoomTool,
  StackScrollTool,
  Enums: csToolsEnums,
  RectangleScissorsTool,
  CircleScissorsTool,
  SphereScissorsTool,
  BrushTool,
  PaintFillTool,
  PanTool,
  segmentation,
  utilities: cstUtils,
} = cornerstoneTools;

const { MouseBindings, KeyboardBindings } = csToolsEnums;
const { ViewportType } = Enums;
const { segmentation: segmentationUtils } = cstUtils;

// Define a unique id for the volume
let renderingEngine;
const renderingEngineId = 'myRenderingEngine';
const viewportId = 'STACK_VIEWPORT';
const viewportId2 = 'SECOND_VIEWPORT';
const toolGroupId = 'TOOL_GROUP_ID';

// ======== Set up page ======== //
setTitleAndDescription(
  'Segmentation in StackViewport',
  'Here we demonstrate how to render a segmentation in StackViewport with a mammography image. We show that even with different stack ordering, we are capable of mathcing the correct labelmap and render them on the second viewport'
);

const size = '500px';
const content = document.getElementById('content');
const viewportGrid = document.createElement('div');

viewportGrid.style.display = 'flex';
viewportGrid.style.display = 'flex';
viewportGrid.style.flexDirection = 'row';

const element1 = document.createElement('div');
element1.oncontextmenu = () => false;

element1.style.width = size;
element1.style.height = size;

viewportGrid.appendChild(element1);

const element2 = document.createElement('div');
element2.oncontextmenu = () => false;

element2.style.width = size;
element2.style.height = size;

viewportGrid.appendChild(element2);

content.appendChild(viewportGrid);

const instructions = document.createElement('p');
instructions.innerText = `
  Left Click: Use selected Segmentation Tool.
  Middle Click: Pan
  Right Click: Zoom
  Mouse wheel: Scroll Stack
  `;

content.append(instructions);

const brushInstanceNames = {
  CircularBrush: 'CircularBrush',
  SphereBrush: 'SphereBrush',
  CircularEraser: 'CircularEraser',
  ThresholdBrush: 'ThresholdBrush',
  DynamicThreshold: 'DynamicThreshold',
};

const brushStrategies = {
  [brushInstanceNames.CircularBrush]: 'FILL_INSIDE_CIRCLE',
  [brushInstanceNames.SphereBrush]: 'FILL_INSIDE_SPHERE',
  [brushInstanceNames.CircularEraser]: 'ERASE_INSIDE_CIRCLE',
  [brushInstanceNames.ThresholdBrush]: 'THRESHOLD_INSIDE_CIRCLE',
  [brushInstanceNames.DynamicThreshold]: 'THRESHOLD_INSIDE_CIRCLE',
};

const brushValues = [
  brushInstanceNames.SphereBrush,
  brushInstanceNames.CircularBrush,
  brushInstanceNames.CircularEraser,
  brushInstanceNames.ThresholdBrush,
  brushInstanceNames.DynamicThreshold,
];

const optionsValues = [
  ...brushValues,
  RectangleScissorsTool.toolName,
  CircleScissorsTool.toolName,
  SphereScissorsTool.toolName,
  PaintFillTool.toolName,
];

let viewport;

const segmentationIds = ['STACK_SEGMENTATION'];
const segmentationRepresentationUIDs = [];
const dropDownId = 'SEGMENTATION_DROPDOWN';

function updateSegmentationDropdownOptions(
  segmentationIds,
  activeSegmentationId
) {
  const dropdown = document.getElementById(
    'SEGMENTATION_DROPDOWN'
  ) as HTMLSelectElement;

  dropdown.innerHTML = '';

  segmentationIds.forEach((segmentationId) => {
    const option = document.createElement('option');
    option.value = segmentationId;
    option.innerText = segmentationId;
    dropdown.appendChild(option);
  });

  if (activeSegmentationId) {
    dropdown.value = activeSegmentationId;
  }
}

addBrushSizeSlider({
  toolGroupId: toolGroupId,
});
// ============================= //
addDropdownToToolbar({
  options: { values: optionsValues, defaultValue: BrushTool.toolName },
  onSelectedValueChange: (nameAsStringOrNumber) => {
    const name = String(nameAsStringOrNumber);
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    // Set the currently active tool disabled
    const toolName = toolGroup.getActivePrimaryMouseButtonTool();

    if (toolName) {
      toolGroup.setToolDisabled(toolName);
    }

    if (brushValues.includes(name)) {
      toolGroup.setToolActive(name, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
    } else {
      const toolName = name;

      toolGroup.setToolActive(toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
    }
  },
});

const thresholdOptions = ['CT Fat: (-150, -70)', 'CT Bone: (200, 1000)'];

addDropdownToToolbar({
  options: { values: thresholdOptions, defaultValue: thresholdOptions[0] },
  onSelectedValueChange: (nameAsStringOrNumber) => {
    const name = String(nameAsStringOrNumber);

    let threshold;
    if (name === thresholdOptions[0]) {
      threshold = [-150, -70];
    } else if (name == thresholdOptions[1]) {
      threshold = [100, 1000];
    }

    segmentationUtils.setBrushThresholdForToolGroup(toolGroupId, threshold);
  },
});

addButtonToToolbar({
  title: 'Create New Segmentation on Current Image',
  onClick: async () => {
    const currentImageId = viewport.getCurrentImageId();

    const segmentationImage =
      imageLoader.createAndCacheDerivedSegmentationImage(currentImageId);

    const newSegImageId = segmentationImage.imageId;

    const newSegmentationId = `SEGMENTATION_${newSegImageId}`;
    segmentationIds.push(newSegmentationId);

    segmentation.addSegmentations([
      {
        segmentationId: newSegmentationId,
        representation: {
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
          data: {
            imageIds: [newSegImageId],
          },
        },
      },
    ]);

    // Add the segmentation representation to the viewport
    const [uid] = await segmentation.addSegmentationRepresentations(
      viewportId,
      [
        {
          segmentationId: newSegmentationId,
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
        },
      ]
    );

    segmentationRepresentationUIDs.push(uid);

    segmentation.activeSegmentation.setActiveSegmentationRepresentation(
      viewportId,
      uid
    );

    // update the dropdown
    updateSegmentationDropdownOptions(segmentationIds, newSegmentationId);
  },
});

addDropdownToToolbar({
  id: dropDownId,
  labelText: 'Set Active Segmentation',
  options: { values: segmentationIds, defaultValue: '' },
  onSelectedValueChange: (nameAsStringOrNumber) => {
    const name = String(nameAsStringOrNumber);
    const index = segmentationIds.indexOf(name);
    const uid = segmentationRepresentationUIDs[index];
    segmentation.activeSegmentation.setActiveSegmentationRepresentation(
      viewportId,
      uid
    );

    // Update the dropdown
    updateSegmentationDropdownOptions(segmentationIds, name);
  },
});

// ============================= //

function setupTools(toolGroupId) {
  // Add tools to Cornerstone3D
  cornerstoneTools.addTool(PanTool);
  cornerstoneTools.addTool(ZoomTool);
  cornerstoneTools.addTool(StackScrollTool);
  cornerstoneTools.addTool(RectangleScissorsTool);
  cornerstoneTools.addTool(CircleScissorsTool);
  cornerstoneTools.addTool(SphereScissorsTool);
  cornerstoneTools.addTool(PaintFillTool);
  cornerstoneTools.addTool(BrushTool);

  // Define a tool group, which defines how mouse events map to tool commands for
  // Any viewport using the group
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  // Manipulation Tools
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(StackScrollTool.toolName);

  // Segmentation Tools
  toolGroup.addTool(RectangleScissorsTool.toolName);
  toolGroup.addTool(CircleScissorsTool.toolName);
  toolGroup.addTool(SphereScissorsTool.toolName);
  toolGroup.addTool(PaintFillTool.toolName);
  toolGroup.addToolInstance(
    brushInstanceNames.CircularBrush,
    BrushTool.toolName,
    {
      activeStrategy: brushStrategies.CircularBrush,
    }
  );

  toolGroup.addToolInstance(
    brushInstanceNames.SphereBrush,
    BrushTool.toolName,
    {
      activeStrategy: brushStrategies.SphereBrush,
    }
  );
  toolGroup.addToolInstance(
    brushInstanceNames.CircularEraser,
    BrushTool.toolName,
    {
      activeStrategy: brushStrategies.CircularEraser,
    }
  );
  toolGroup.addToolInstance(
    brushInstanceNames.ThresholdBrush,
    BrushTool.toolName,
    {
      activeStrategy: brushStrategies.ThresholdBrush,
    }
  );

  toolGroup.addToolInstance(
    brushInstanceNames.DynamicThreshold,
    BrushTool.toolName,
    {
      activeStrategy: brushStrategies.DynamicThreshold,
      preview: {
        enabled: true,
      },
      strategySpecificConfiguration: {
        useCenterSegmentIndex: true,
        THRESHOLD: { isDynamic: true, dynamicRadius: 3 },
      },
    }
  );

  toolGroup.setToolActive(brushInstanceNames.SphereBrush, {
    bindings: [{ mouseButton: MouseBindings.Primary }],
  });

  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Auxiliary, // Middle Click
      },
      {
        mouseButton: MouseBindings.Primary,
        modifierKey: KeyboardBindings.Ctrl,
      },
    ],
  });
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Secondary, // Right Click
      },
      {
        mouseButton: MouseBindings.Primary,
        modifierKey: KeyboardBindings.Shift,
      },
    ],
  });
  toolGroup.setToolActive(StackScrollTool.toolName, {
    bindings: [
      {
        mouseButton: MouseBindings.Wheel,
      },
    ],
  });

  return toolGroup;
}
// ============================= //

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await initDemo();

  const toolGroup = setupTools(toolGroupId);

  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
  });

  const mgImageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.4792.2001.105216574054253895819671475627',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.4792.2001.326862698868700146219088322924',
    wadoRsRoot: 'https://d33do7qe4w26qo.cloudfront.net/dicomweb',
  });

  // Instantiate a rendering engine
  renderingEngine = new RenderingEngine(renderingEngineId);

  // Create the viewports
  const viewportInputArray = [
    {
      viewportId: viewportId,
      type: ViewportType.STACK,
      element: element1,
    },
    {
      viewportId: viewportId2,
      type: ViewportType.STACK,
      element: element2,
    },
  ];
  renderingEngine.setViewports(viewportInputArray);
  toolGroup.addViewport(viewportId);
  toolGroup.addViewport(viewportId2);
  viewport = renderingEngine.getViewport(viewportId);
  const viewport2 = renderingEngine.getViewport(viewportId2);

  // const imageIdsArray = [imageIds[0], imageIds[100], mgImageIds[0]];
  const imageIdsArray = mgImageIds;
  const imageIdsArray2 = [imageIds[100]];

  const segImages = await imageLoader.createAndCacheDerivedSegmentationImages(
    imageIdsArray
  );

  await viewport.setStack(imageIdsArray, 0);
  await viewport2.setStack(imageIdsArray2, 0);

  cornerstoneTools.utilities.stackContextPrefetch.enable(element1);
  cornerstoneTools.utilities.stackContextPrefetch.enable(element2);

  const segmentationImageIds = segImages.map((it) => it.imageId);
  // fillStackSegmentationWithMockData({
  //   imageIds: imageIdsArray.slice(0, 2),
  //   segmentationImageIds,
  //   cornerstone,
  // });

  renderingEngine.renderViewports([viewportId]);

  segmentation.addSegmentations([
    {
      segmentationId: segmentationIds[0],
      representation: {
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
        data: {
          imageIds: segmentationImageIds,
        },
      },
    },
  ]);

  // Add the segmentation representation to the viewport
  const [uid] = await segmentation.addSegmentationRepresentations(viewportId, [
    {
      segmentationId: segmentationIds[0],
      type: csToolsEnums.SegmentationRepresentations.Labelmap,
    },
  ]);
  const [uid2] = await segmentation.addSegmentationRepresentations(
    viewportId2,
    [
      {
        segmentationId: segmentationIds[0],
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
      },
    ]
  );

  segmentationRepresentationUIDs.push(uid);
}

run();
