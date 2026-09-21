'use client';

import {FC} from "react";
import {Field, Input, InputGroup, SimpleGrid, Stack} from "@chakra-ui/react";
import {Control, FieldErrors, UseFormRegister} from "react-hook-form";
import BranchPicker from "@/app/_components/delivery-fields/branch-picker";
import {DeliveryValues} from "@/app/_components/delivery-fields/types";

export type {DeliveryValues};

type DeliveryFieldsProps = {
    register: UseFormRegister<DeliveryValues>;
    errors: FieldErrors<DeliveryValues>;
    /** The picker writes `city` and `branch` itself, so it needs the form. */
    control: Control<DeliveryValues>;
    disabled?: boolean;
};

/**
 * Where the tracker should go.
 *
 * One set of fields for both places that ask: checkout, where an order cannot
 * be placed without them, and the order page, where they stay editable until
 * it ships. The form around them owns the values — this only knows how to ask.
 */
const DeliveryFields: FC<DeliveryFieldsProps> = ({register, errors, control, disabled}) => (
    <Stack gap={4}>
        <SimpleGrid columns={{base: 1, sm: 2}} gap={4}>
            <Field.Root required invalid={!!errors.recipientName}>
                <Field.Label>Отримувач</Field.Label>
                <Input
                    placeholder="Прізвище та ім'я"
                    autoComplete="name"
                    disabled={disabled}
                    {...register('recipientName', {required: 'Вкажіть отримувача'})}
                />
                <Field.ErrorText>{errors.recipientName?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root required invalid={!!errors.phone}>
                <Field.Label>Телефон</Field.Label>
                <InputGroup startElement="+380">
                    <Input
                        ps="6ch"
                        type="tel"
                        placeholder="501234567"
                        autoComplete="tel-national"
                        disabled={disabled}
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
                <Field.HelperText>За ним вас знайде кур&#39;єр</Field.HelperText>
            </Field.Root>
        </SimpleGrid>

        <BranchPicker control={control} disabled={disabled} />

        <Field.Root>
            <Field.Label>Коментар</Field.Label>
            <Input
                placeholder="Що нам варто знати про доставку"
                disabled={disabled}
                {...register('comment')}
            />
        </Field.Root>
    </Stack>
);

export default DeliveryFields;
