'use client';

import {FC, useEffect} from 'react';
import {Button, Field, Input, Stack} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {useTsutsyk, useUpdateTsutsyk} from '@/app/_lib/useTracker';
import {uploadTsutsykPhoto} from '@/app/_lib/uploadTsutsykPhoto';
import AvatarUpload from '@/app/_components/avatar-upload';

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

    const { register, handleSubmit, reset } = useForm<Values>();

    useEffect(() => {
        if (tsutsyk) reset({ alertDistanceMeters: tsutsyk.alertDistanceMeters });
    }, [tsutsyk, reset]);

    const onSubmit = handleSubmit(async ({ alertDistanceMeters, photo }) => {
        const file = photo?.[0];
        const photoUrl = file ? await uploadTsutsykPhoto(tsutsykId, file) : undefined;

        await mutate({ variables: { id: tsutsykId, alertDistanceMeters, photoUrl } });
    });

    return (
        <Stack as="form" gap={3} onSubmit={onSubmit}>
            <Field.Root>
                <AvatarUpload
                    register={register('photo')}
                    name={tsutsyk?.name ?? undefined}
                    src={tsutsyk?.photoUrl}
                />
            </Field.Root>

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
