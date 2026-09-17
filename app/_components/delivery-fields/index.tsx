'use client';

import { FC } from "react";
import { Field, Input, SimpleGrid, Stack } from "@chakra-ui/react";

export type DeliveryValues = {
    recipientName?: string | null;
    phone?: string | null;
    city?: string | null;
    branch?: string | null;
    comment?: string | null;
};

type DeliveryFieldsProps = {
    /** What the fields start with — an order's current details, or nothing. */
    defaults?: DeliveryValues | null;
    disabled?: boolean;
};

/**
 * Where the tracker should go.
 *
 * Plain uncontrolled inputs with `name`s, so the same fields serve the
 * checkout form (posted to a Server Action) and the order page (read as
 * FormData and sent as a mutation) — and so the branch picker, when it
 * arrives, is swapped in one place rather than two.
 */
const DeliveryFields: FC<DeliveryFieldsProps> = ({ defaults, disabled }) => (
    <Stack gap="4">
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
            <Field.Root required>
                <Field.Label>
                    Отримувач <Field.RequiredIndicator />
                </Field.Label>
                <Input
                    name="recipientName"
                    placeholder="Прізвище та ім’я"
                    autoComplete="name"
                    required
                    disabled={disabled}
                    defaultValue={defaults?.recipientName ?? ""}
                />
            </Field.Root>

            <Field.Root required>
                <Field.Label>
                    Телефон <Field.RequiredIndicator />
                </Field.Label>
                <Input
                    name="phone"
                    type="tel"
                    placeholder="+380…"
                    autoComplete="tel"
                    required
                    disabled={disabled}
                    defaultValue={defaults?.phone ?? ""}
                />
            </Field.Root>

            <Field.Root required>
                <Field.Label>
                    Місто <Field.RequiredIndicator />
                </Field.Label>
                <Input
                    name="city"
                    placeholder="Львів"
                    autoComplete="address-level2"
                    required
                    disabled={disabled}
                    defaultValue={defaults?.city ?? ""}
                />
            </Field.Root>

            {/* TODO(delivery): a plain text box until the Nova Poshta branch
                picker lands. The API only checks that a branch is filled in,
                so swapping this input for the picker is a change here and
                nowhere else. */}
            <Field.Root required>
                <Field.Label>
                    Відділення <Field.RequiredIndicator />
                </Field.Label>
                <Input
                    name="branch"
                    placeholder="Відділення №12, вул. Зелена 1"
                    required
                    disabled={disabled}
                    defaultValue={defaults?.branch ?? ""}
                />
                <Field.HelperText>
                    Поки що вручну — невдовзі тут буде вибір відділення зі списку.
                </Field.HelperText>
            </Field.Root>
        </SimpleGrid>

        <Field.Root>
            <Field.Label>Коментар</Field.Label>
            <Input
                name="comment"
                placeholder="Що нам варто знати про доставку"
                disabled={disabled}
                defaultValue={defaults?.comment ?? ""}
            />
        </Field.Root>
    </Stack>
);

export default DeliveryFields;
