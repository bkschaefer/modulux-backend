
export type TSchemaResource = {
    name: string;
    title: string;
    settings?: { dataTable: { entriesPerPage: number } };
    fields: Record<string, any>[]
}

export type TEntryResource = {
    _id?: string;
    [key: string]: any;
}

export type TCollectionResource = {
    schema: TSchemaResource
    entries: TEntryResource[]
}

export type TField =
  | ITextField
  | INumberField
  | IBooleanField
  | IOptionField
  | ICompositeField
  | IFieldArray
  | IImageField;

export type TFieldType =
  | "TextField"
  | "NumberField"
  | "BooleanField"
  | "OptionField"
  | "FieldArray"
  | "ImageField"
  | "CompositeField"
  | "RichTextField";

export interface IField {
  name: string;
  label: string;
  settings: {
    dataTable: {
      visible: boolean;
      columnWidth: number;
    };
  };
  fieldType: TFieldType;
  required?: boolean;
}

export interface ITextField extends IField {
  fieldType: "TextField";
  defaultValue?: string;
  pattern?: string;
  maxLength?: number;
  minLength?: number;
}

export interface IImageField extends IField {
  fieldType: "ImageField";
  defaultValue?: File[];
  maxLength?: number;
  minLength?: number;
}

export interface IRichTextField extends IField {
  fieldType: "RichTextField";
  defaultValue?: Record<string, any>;
}

export interface INumberField extends IField {
  fieldType: "NumberField";
  defaultValue?: number;
  min?: number;
  max?: number;
}

export interface IBooleanField extends IField {
  fieldType: "BooleanField";
  defaultValue?: boolean;
}

export interface IOptionField extends IField {
  fieldType: "OptionField";
  options: string[];
  defaultSelected?: number;
}

export interface ICompositeField extends IField {
  fieldType: "CompositeField";
  fields: TField[];
}

export interface IFieldArray extends IField {
  fieldType: "FieldArray";
  minLength?: number;
  maxLength?: number;
  field?:
    | ITextField
    | INumberField
    | IBooleanField
    | IOptionField
    | ICompositeField;
}

export type TAnyField =
  | INumberField
  | ITextField
  | IBooleanField
  | IOptionField
  | ICompositeField
  | IFieldArray;

  export type TImageObject = {
    originalName: string;
    key: string;
    size: number;
  }


