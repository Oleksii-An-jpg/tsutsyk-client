'use client';

import {FC, useEffect, useState} from 'react';
import {Avatar, Button, Field, HStack, Input, Stack} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {useTsutsyk, useUpdateTsutsyk} from '@/app/_lib/useTracker';
import {uploadTsutsykPhoto} from '@/app/_lib/uploadTsutsykPhoto';

type TsutsykProfileProps = {
    tsutsykId: string;
};

type Values = {
    alertDistanceMeters: number;
    photo?: FileList;
};

const TsutsykProfile: FC<TsutsykProfileProps> = ({ tsutsykId }) => {
    const { data } = useTsutsyk(tsutsykId);
    const tsutsyk = data?.getTsutsyk;
    const [mutate, { loading: saving }] = useUpdateTsutsyk();
    const [preview, setPreview] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch } = useForm<Values>();
    const photoFiles = watch('photo');

    useEffect(() => {
        if (tsutsyk) reset({ alertDistanceMeters: tsutsyk.alertDistanceMeters });
    }, [tsutsyk, reset]);

    useEffect(() => {
        const file = photoFiles?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [photoFiles]);

    const onSubmit = handleSubmit(async ({ alertDistanceMeters, photo }) => {
        const file = photo?.[0];
        const photoUrl = file ? await uploadTsutsykPhoto(tsutsykId, file) : undefined;

        await mutate({ variables: { id: tsutsykId, alertDistanceMeters, photoUrl } });
    });

    return (
        <Stack as="form" gap={3} onSubmit={onSubmit}>
            <HStack gap={3}>
                <Avatar.Root size="lg" colorPalette="pink">
                    <Avatar.Fallback name="Карематик" />
                    {(preview ?? tsutsyk?.photoUrl) && (
                        <Avatar.Image src={preview ?? tsutsyk?.photoUrl ?? undefined} />
                    )}
                </Avatar.Root>
                <Field.Root>
                    <Field.Label>Фото</Field.Label>
                    <Input type="file" accept="image/*" p={1} {...register('photo')} />
                </Field.Root>
            </HStack>

            <Field.Root>
                <Field.Label>Дистанція сповіщення (м)</Field.Label>
                <Input
                    type="number"
                    min={1}
                    {...register('alertDistanceMeters', { valueAsNumber: true, min: 1 })}
                />
            </Field.Root>

            <Button type="submit" size="sm" colorPalette="blue" loading={saving}>
                Зберегти
            </Button>
        </Stack>
    );
};

export default TsutsykProfile;
