'use client';

import {FC} from "react";
import {Alert, Button, Field, PinInput, VStack} from "@chakra-ui/react";
import {Controller, useForm} from "react-hook-form";
import {ConfirmationResult} from "firebase/auth";

type Values = {
    code: string[];
}

type VerificationProps = {
    result: ConfirmationResult
    onChangeNumber: () => void
}

const Verification: FC<VerificationProps> = ({ result, onChangeNumber }) => {
    const { control, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<Values>();

    const onSubmit = handleSubmit(async (data) => {
        if (!result) return;
        try {
            const userCredential = await result.confirm(data.code.join(''));
            await userCredential.user.getIdTokenResult();
        } catch (e) {
            const err = e as unknown as Error;
            const errorMessage = err.message || 'Verification failed';
            setError('code', { message: errorMessage });
        }
    });

    return <VStack asChild gap={4}>
        <form onSubmit={onSubmit}>
            <Alert.Root status="info">
                <Alert.Indicator />
                <Alert.Description>
                    Введіть 6-значний код, надісланий на ваш телефон
                </Alert.Description>
            </Alert.Root>

            <Field.Root disabled={!result} orientation="horizontal" invalid={!!errors.code}>
                <Field.Label>Код (смс)</Field.Label>
                <Controller
                    control={control}
                    name="code"
                    render={({ field }) => (
                        <PinInput.Root
                            w="full"
                            value={field.value}
                            onValueComplete={() => onSubmit()}
                            onValueChange={(e) => field.onChange(e.value)}
                        >
                            <PinInput.HiddenInput />
                            <PinInput.Control>
                                <PinInput.Input index={0} />
                                <PinInput.Input index={1} />
                                <PinInput.Input index={2} />
                                <PinInput.Input index={3} />
                                <PinInput.Input index={4} />
                                <PinInput.Input index={5} />
                            </PinInput.Control>
                        </PinInput.Root>
                    )}
                />
                <Field.ErrorText>{errors.code?.message}</Field.ErrorText>
            </Field.Root>

            <Button
                type="submit"
                colorPalette="blue"
                width="full"
                loading={isSubmitting}
            >
                Підтвердити код
            </Button>

            <Button
                variant="ghost"
                width="full"
                onClick={onChangeNumber}
                type="button"
            >
                Використати інший номер
            </Button>
        </form>
    </VStack>
}

export default Verification