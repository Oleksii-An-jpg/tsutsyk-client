'use client';

import {FC, useState} from "react";
import {Button, Field, Input, VStack} from "@chakra-ui/react";
import {useForm} from "react-hook-form";
import {ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber} from "firebase/auth";
import {auth} from "@/app/_lib/firebase";
import Verification from "@/app/_components/auth/verification";

type Values = {
    phone: string;
}

const PhoneAuth: FC = () => {
    // Default mode: quiet while typing, error on the submit attempt, then live
    // as it's corrected. Note that `disabled={!isValid}` can't come back without
    // dragging onChange back with it — isValid only tracks outside onSubmit —
    // and that pairing is what used to flag a half-typed number as invalid.
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<Values>();
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    return <VStack gap={4} asChild>
        {confirmationResult ? <Verification result={confirmationResult} /> : <form onSubmit={handleSubmit(async (data) => {
            try {
                // Initialize RecaptchaVerifier
                const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                });

                const confirmation = await signInWithPhoneNumber(auth, data.phone, recaptchaVerifier);
                setConfirmationResult(confirmation);
            } catch (e) {
                const err = e as unknown as Error;
                const errorMessage = err.message || 'Не вдалося надіслати код підтвердження';
                setError('phone', { message: errorMessage });
            }
        })}>
            <Field.Root
                required
                invalid={!!errors.phone}
            >
                <Field.Label>Телефон</Field.Label>
                <Input
                    type="tel"
                    placeholder="+380501234567"
                    {...register('phone', {
                        required: 'Потрібно вказати телефон',
                        setValueAs(value: string) {
                            return value.split(' ').join('')
                        },
                        pattern: {
                            value: /^\+[1-9]\d{1,14}$/,
                            message: 'Недійсний формат номера телефону',
                        },
                    })}
                />
                <Field.ErrorText>{errors.phone?.message}</Field.ErrorText>
                <Field.HelperText>Вкажіть код країни (наприклад, +380 для України)</Field.HelperText>
            </Field.Root>

            <Button
                type="submit"
                colorPalette="blue"
                width="full"
                loading={isSubmitting}
            >
                Надіслати код підтвердження
            </Button>

            <div id="recaptcha-container" />
        </form>}
    </VStack>
}

export default PhoneAuth;