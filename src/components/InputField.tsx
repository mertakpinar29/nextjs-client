import { FormControl, FormErrorMessage, FormLabel, Input } from '@chakra-ui/react';
import React, { InputHTMLAttributes } from 'react'
import { useField } from 'formik'

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & { 
    label: string, 
    name: string,
    placeholder: string 
}

export const InputField: React.FC<InputFieldProps> = (props) => {
        const [field, { error }] = useField(props)
        return (
            /* Casting string to booleans
                !!error means:
                if error === '' -> false
                if error !== '' -> true
            */
            <FormControl isInvalid={!!error}>
               <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
               <Input {...field} id={field.name} placeholder={props.placeholder} />
                { error ?  <FormErrorMessage>{error}</FormErrorMessage> : null }
            </FormControl>
        );
}