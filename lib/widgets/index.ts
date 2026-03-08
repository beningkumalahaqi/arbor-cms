export type {
  WidgetDefinition,
  WidgetPropType,
  WidgetPropDefinition,
  WidgetInstance,
  WidgetAreaDefinition,
  WidgetCategory,
  WidgetSlotDefinition,
  SelectOption,
  FormElementType,
  FormElementDefinition,
} from "./types";

export {
  getWidget,
  getAllWidgets,
  isValidWidgetType,
  getWidgetsByCategory,
  validateWidgetProps,
  buildDefaultWidgetProps,
} from "./registry";

export type { WidgetValidationError } from "./registry";
