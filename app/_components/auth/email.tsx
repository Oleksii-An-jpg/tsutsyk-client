'use client';

import {FC} from "react";
import {Button, Field, Input, VStack} from "@chakra-ui/react";
import {useForm} from "react-hook-form";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import {auth} from "@/app/_lib/firebase";

type Values = {
    email: string;
    password: string;
}

type EmailAuthProps = {
    isSignUp: boolean;
}

const EmailAuth: FC<EmailAuthProps> = ({ isSignUp }) => {
    // Nothing here reads isValid, so onChange only ever bought the noise of
    // telling someone their half-typed address is invalid.
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
        mode: 'onTouched'
    });
    return <VStack gap={4} asChild>
        <form onSubmit={handleSubmit(async (data) => {
            try {
                isSignUp
                    ? await createUserWithEmailAndPassword(auth, data.email, data.password)
                    : await signInWithEmailAndPassword(auth, data.email, data.password);

            } catch (e) {
                const err = e as unknown as Error;
                const errorMessage = err.message || 'Authentication failed';

                // Set field-specific errors if possible
                if (errorMessage.includes('email')) {
                    setError('email', { message: errorMessage });
                } else if (errorMessage.includes('password')) {
                    setError('password', { message: errorMessage });
                } else {
                    // setGeneralError(errorMessage);
                }
            }
        })}>
            <Field.Root
                required
                invalid={!!errors.email}
            >
                <Field.Label>Пошта</Field.Label>
                <Input
                    type="email"
                    placeholder="admin@example.com"
                    {...register('email', {
                        required: 'Потрібно вказати електронну пошту',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Недійсна адреса електронної пошти',
                        },
                    })}
                />
                <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root
                required
                invalid={!!errors.password}
            >
                <Field.Label>Пароль</Field.Label>
                <Input
                    type="password"
                    placeholder="••••••••"
                    {...register('password', {
                        required: 'Потрібно вказати пароль',
                        minLength: {
                            value: 6,
                            message: 'Пароль має містити щонайменше 6 символів',
                        },
                    })}
                />
                <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>

            <Button
                type="submit"
                colorPalette="blue"
                width="full"
                loading={isSubmitting}
            >
                {isSignUp ? 'Створити обліковий запис' : 'Увійти'}
            </Button>
        </form>
    </VStack>
}

export default EmailAuth;