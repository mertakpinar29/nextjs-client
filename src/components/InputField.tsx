import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/react";
import React, { InputHTMLAttributes } from "react";
import { useField } from "formik";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  textarea?: boolean;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  textarea,
  size: _,
  ...props
}) => {
  const [field, { error }] = useField(props);
  return (
    /* Casting string to booleans
                !!error means:
                if error === '' -> false
                if error !== '' -> true
            */
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      {textarea ? (
        <Textarea
          {...field}
          //{...props}
          id={field.name}
          placeholder={props.placeholder}
        />
      ) : (
        <Input
          {...field}
          {...props}
          id={field.name}
          placeholder={props.placeholder}
        />
      )}
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};
