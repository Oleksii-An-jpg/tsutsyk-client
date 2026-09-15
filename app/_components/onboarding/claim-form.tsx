'use client';

import {FC} from 'react';
import {useRouter} from 'next/navigation';
import {Button, Card, Field, Heading, Input, Stack, Text} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {useClaimTsutsyk} from '@/app/_lib/useTracker';
import {uploadTsutsykPhoto} from '@/app/_lib/uploadTsutsykPhoto';
import {me} from '@/app/_lib/me';
import AvatarUpload from '@/app/_components/avatar-upload';

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

    const {register, handleSubmit, watch, formState: {errors}} = useForm<Values>();
    const nickname = watch('name');

    const onSubmit = handleSubmit(async ({name, photo}) => {
        const file = photo?.[0];
        const photoUrl = file && await uploadTsutsykPhoto(id, file);
        await mutate({variables: {id, name, photoUrl}});

        // The refetch of getMyTsutsyks is still in flight when the mutation
        // resolves, so /me would otherwise read a stale "owns nothing" and
        // bounce this brand-new ґазда straight back out to /auth. We know what
        // we just claimed; record it and let the refetch confirm it.
        const self = me();
        me({
            ...self,
            tsutsykIds: Array.from(new Set([...self.tsutsykIds, id])),
            authorised: true,
            tsutsyksChecked: true,
        });

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
                    <Field.Root>
                        <AvatarUpload
                            {...register('photo')}
                            nickname={nickname}
                            label="Фото"
                        />
                    </Field.Root>

                    <Field.Root required invalid={!!errors.name}>
                        <Field.Label>Ім&#39;я</Field.Label>
                        <Input placeholder="Каремат" {...register('name', {required: "Вкажіть ім'я"})} />
                        <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
                    </Field.Root>

                    {error && (
                        <Text color="red.500" fontSize="sm">
                            Не вдалося зареєструвати цуцика. Можливо, його вже забрали. Спробуйте оновити сторінку.
                        </Text>
                    )}

                    <Button type="submit" colorPalette="blue" loading={saving}>
                        Зареєструвати цуцика
                    </Button>
                </Stack>
            </Card.Body>
        </Card.Root>
    );
};

export default ClaimForm;
