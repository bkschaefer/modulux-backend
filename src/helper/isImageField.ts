const isImageObject = (obj: Record<string, any>): boolean => {
    return (
      obj &&
      typeof obj === "object" &&
      obj.originalName &&
      typeof obj.originalName === "string" &&
      obj.key &&
      typeof obj.key === "string" &&
      obj.size &&
      typeof obj.size === "number"
    );
  }


export function isImageField(value: any): boolean {
    return Array.isArray(value) &&
      value.every((image: any) => isImageObject(image))
  }

