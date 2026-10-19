import React from "react";
import { InputTextarea as PrimeInputTextarea } from "primereact/inputtextarea";

export const InputTextarea = React.forwardRef((props, ref) => (
  <PrimeInputTextarea ref={ref} {...props} />
));

InputTextarea.displayName = "InputTextarea";

export default InputTextarea;
