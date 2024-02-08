import type { Types } from '@cornerstonejs/core';

type Annotation = {
  /** A unique identifier for this annotation */
  annotationUID?: string;
  /**
   * Parent annotation UID
   *
   * An annotation may have a parent annotation when it is, for example, a
   * hole inside a contour.
   */
  parentAnnotationUID?: string;
  /**
   * Array that contains all child annotation UID
   *
   * An annotation may have one or more child annotations when it is contour
   * and have some holes in it.
   */
  childAnnotationUIDs?: string[];
  /** If the annotation is being hovered over and is highlighted */
  highlighted?: boolean;
  /** If the annotation is locked for manipulation */
  isLocked?: boolean;
  /** If the annotation is visible for manipulation */
  isVisible?: boolean;
  /** Has annotation data been invalidated (e.g., as a result of mouse interactions) */
  invalidated?: boolean;
  /** If the annotation is auto generated from other annotations*/
  autoGenerated?: boolean;
  /** Metadata for annotation */
  metadata: Types.ViewTarget & {
    /**
     * The registered name of the tool
     */
    toolName: string;
  };
  /**
   * Data for annotation, Derivatives need to define their own data types.
   */
  data: {
    /** Annotation handles that are grabbable for manipulation */
    handles?: {
      /** world location of the handles in the space */
      points?: Types.Point3[];
      /** index of the active handle being manipulated */
      activeHandleIndex?: number | null;
      /** annotation text box information */
      textBox?: {
        /** whether the text box has moved */
        hasMoved: boolean;
        /** the world location of the text box */
        worldPosition: Types.Point3;
        /** text box bounding box information */
        worldBoundingBox?: {
          /** Top left location of the text box in the world space */
          topLeft: Types.Point3;
          /** Top right location of the text box in the world space */
          topRight: Types.Point3;
          /** Bottom left location of the text box in the world space */
          bottomLeft: Types.Point3;
          /** Bottom right location of the text box in the world space */
          bottomRight: Types.Point3;
        };
      };
      [key: string]: any;
    };
    [key: string]: any;
    /** Cached Annotation statistics which is specific to the tool */
    cachedStats?: unknown;
  };
};

/** Array of annotations */
type Annotations = Array<Annotation>;

type GroupSpecificAnnotations = {
  /** Each tool annotations */
  [toolName: string]: Annotations;
};

/**
 * All frame of reference specific annotations for all tools.
 */
type AnnotationState = {
  /**
   * A string representing the key that can be used
   * to retrieve the key-specific annotations. For instance, our default
   * annotation state key is the FrameOfReferenceUID which is for our default
   * frameOfReferenceAnnotationManager. You can write your own annotation manager
   * that works for a different use case and use a different key.
   */
  [key: string]: GroupSpecificAnnotations;
};

export { Annotation, Annotations, GroupSpecificAnnotations, AnnotationState };
