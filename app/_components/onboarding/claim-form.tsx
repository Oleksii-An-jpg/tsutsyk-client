'use client';

import {FC, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Avatar, Button, Card, Field, HStack, Heading, Input, Stack, Text} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {useClaimTsutsyk} from '@/app/_lib/useTracker';
import {uploadTsutsykPhoto} from '@/app/_lib/uploadTsutsykPhoto';

type ClaimFormProps = {
    id: string;
};

type Values = {
    name: string;
    photo?: FileList;
};

const ClaimForm: FC<ClaimFormProps> = ({id}) => {
    const router = useRouter();
    const [mutate, {loading: saving, error}] = useClaimTsutsyk();
    const [preview, setPreview] = useState<string | null>(null);

    const {register, handleSubmit, watch, formState: {errors}} = useForm<Values>();
    const photoFiles = watch('photo');
    const watchedName = watch('name');

    useEffect(() => {
        const file = photoFiles?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [photoFiles]);

    const onSubmit = handleSubmit(async ({name, photo}) => {
        const file = photo?.[0];
        const photoUrl = file ? await uploadTsutsykPhoto(id, file) : undefined;
        await mutate({variables: {id, name, photoUrl}});
        router.push('/me');
    });

    return (
        <Card.Root>
            <Card.Header>
                <Heading size="lg">Останній крок</Heading>
                <Text fontSize="sm" color="gray.500">
                    Ім&#39;я та фото цуцика
                </Text>
            </Card.Header>

            <Card.Body>
                <Stack as="form" gap={4} onSubmit={onSubmit}>
                    <HStack gap={3}>
                        <Avatar.Root size="lg" colorPalette="pink">
                            <Avatar.Fallback name={watchedName || 'Цуцик'} />
                            {preview && <Avatar.Image src={preview} />}
                        </Avatar.Root>
                        <Field.Root>
                            <Field.Label>Фото</Field.Label>
                            <Input type="file" accept="image/*" p={1} {...register('photo')} />
                        </Field.Root>
                    </HStack>

                    <Field.Root required invalid={!!errors.name}>
                        <Field.Label>Ім&#39;я</Field.Label>
                        <Input placeholder="Рекс" {...register('name', {required: "Вкажіть ім'я"})} />
                        <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
                    </Field.Root>

                    {error && (
                        <Text color="red.500" fontSize="sm">
                            Не вдалося зареєструвати цуцика. Можливо, його вже забрали. Спробуйте оновити сторінку.
                        </Text>
                    )}

                    <Button type="submit" colorPalette="blue" loading={saving}>
                        Забрати цуцика
                    </Button>
                </Stack>
            </Card.Body>
        </Card.Root>
    );
};

export default ClaimForm;
