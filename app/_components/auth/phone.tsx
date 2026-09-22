'use client';

import {FC, useRef, useState} from "react";
import {Button, Field, Input, InputGroup, VStack} from "@chakra-ui/react";
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
    const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, setError } = useForm<Values>({
        mode: 'onTouched'
    });
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    // A verifier renders its widget into #recaptcha-container, and a second one
    // can't render into the same element — so the old one has to be cleared
    // before a retry or before this form comes back for a different number.
    const verifierRef = useRef<RecaptchaVerifier | null>(null);
    const clearVerifier = () => {
        verifierRef.current?.clear();
        verifierRef.current = null;
    };
    return <VStack gap={4} asChild>
        {confirmationResult ? <Verification
            result={confirmationResult}
            onChangeNumber={() => {
                clearVerifier();
                setConfirmationResult(null);
            }}
        /> : <form onSubmit={(event) => handleSubmit(async (data) => {
            try {
                clearVerifier();
                verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                });

                const confirmation = await signInWithPhoneNumber(auth, data.phone, verifierRef.current);
                setConfirmationResult(confirmation);
            } catch (e) {
                clearVerifier();
                const err = e as unknown as Error;
                const errorMessage = err.message || 'Не вдалося надіслати код підтвердження';
                setError('phone', { message: errorMessage });
            }
        })(event)}>
            <Field.Root
                required
                invalid={!!errors.phone}
            >
                <Field.Label>Телефон</Field.Label>
                <InputGroup startElement="+380">
                    <Input
                        ps="6ch"
                        type="tel"
                        placeholder="+380501234567"
                        {...register('phone', {
                            setValueAs(value: string) {
                                return `+380${value.split(' ').join('')}`
                            },
                            pattern: {
                                value: /^\+380\d{9}$/,
                                message: 'Номер телефону має містити 9 цифр',
                            },
                        })}
                    />
                </InputGroup>
                <Field.ErrorText>{errors.phone?.message}</Field.ErrorText>
                <Field.HelperText>Вкажіть код країни (наприклад, +380 для України)</Field.HelperText>
            </Field.Root>

            <Button
                type="submit"
                colorPalette="blue"
                width="full"
                loading={isSubmitting}
                disabled={!isValid}
            >
                Надіслати код підтвердження
            </Button>

            <div id="recaptcha-container" />
        </form>}
    </VStack>
}

export default PhoneAuth;