'use client';

import {FC} from "react";
import {Field, Input, InputGroup, SimpleGrid, Stack, NativeSelect} from "@chakra-ui/react";
import {FieldErrors, UseFormRegister} from "react-hook-form";
import {Region} from "@/app/_lib/novaposhta/types";

export type DeliveryValues = {
    recipientName: string;
    phone: string;
    region: Region['ref'];
    city: string;
    branch: string;
    comment: string;
};

type DeliveryFieldsProps = {
    register: UseFormRegister<DeliveryValues>;
    errors: FieldErrors<DeliveryValues>;
    regions: Region[];
    disabled?: boolean;
};

/**
 * Where the tracker should go.
 *
 * One set of fields for both places that ask: checkout, where an order cannot
 * be placed without them, and the order page, where they stay editable until
 * it ships. The form around them owns the values — this only knows how to ask.
 */
const DeliveryFields: FC<DeliveryFieldsProps> = ({register, errors, disabled, regions}) => (
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

            <Field.Root required invalid={!!errors.region}>
                <Field.Label>Область</Field.Label>
                <NativeSelect.Root size="sm">
                    <NativeSelect.Field {...register('region')} placeholder="Оберіть область">
                        {regions.map(region => (
                            <option key={region.ref} value={region.ref}>{region.description}</option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Field.ErrorText>{errors.region?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root required invalid={!!errors.city}>
                <Field.Label>Місто</Field.Label>
                <Input
                    placeholder="Львів"
                    autoComplete="address-level2"
                    disabled={disabled}
                    {...register('city', {required: 'Вкажіть місто'})}
                />
                <Field.ErrorText>{errors.city?.message}</Field.ErrorText>
            </Field.Root>

            {/* TODO(delivery): a plain text box until the Nova Poshta branch
                picker lands. The API only checks that a branch is filled in,
                so swapping this input for the picker is a change here and
                nowhere else. */}
            <Field.Root required invalid={!!errors.branch}>
                <Field.Label>Відділення</Field.Label>
                <Input
                    placeholder="Відділення №12, вул. Зелена 1"
                    disabled={disabled}
                    {...register('branch', {required: 'Вкажіть відділення'})}
                />
                <Field.ErrorText>{errors.branch?.message}</Field.ErrorText>
                <Field.HelperText>
                    Поки що вручну — невдовзі тут буде вибір відділення зі списку.
                </Field.HelperText>
            </Field.Root>
        </SimpleGrid>

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
