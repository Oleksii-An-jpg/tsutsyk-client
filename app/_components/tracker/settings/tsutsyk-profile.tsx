'use client';

import {FC, useMemo} from 'react';
import {
    Badge,
    Button,
    Field,
    HStack,
    Input,
    NativeSelect,
    Stack,
    Text,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {useAlertRegions, useTsutsyk, useUpdateTsutsyk} from '@/app/_lib/useTracker';
import {uploadTsutsykPhoto} from '@/app/_lib/uploadTsutsykPhoto';
import AvatarUpload from '@/app/_components/avatar-upload';
import {AIR_RAID} from '@/app/_components/tracker/air-raid';

type TsutsykProfileProps = {
    tsutsykId: string;
};

type Values = {
    alertDistanceMeters: number;
    /** A native select hands back strings; '' is "no region chosen". */
    alertRegionUid: string;
    photo?: FileList;
};

const NO_REGION = '';

const TsutsykProfile: FC<TsutsykProfileProps> = ({ tsutsykId }) => {
    const { data } = useTsutsyk(tsutsykId);
    const tsutsyk = data?.getTsutsyk;
    const { data: regionsData } = useAlertRegions();
    const regions = regionsData?.getAlertRegions ?? [];
    const [mutate, { loading: saving }] = useUpdateTsutsyk();

    // Fed through `values` rather than a `reset()` in an effect: a plain reset
    // drops react-hook-form's field refs and only writes the DOM once the
    // inputs re-register, which the drawer's first open does not reliably do —
    // the select sat on "no region" while the form held the saved one. `values`
    // resets with the refs kept, so the select is written directly.
    //
    // Waits for the region list too: a native select can only take a value it
    // has an <option> for.
    const values = useMemo<Values | undefined>(
        () =>
            tsutsyk && regionsData
                ? {
                      alertDistanceMeters: tsutsyk.alertDistanceMeters,
                      alertRegionUid: tsutsyk.alertRegion
                          ? String(tsutsyk.alertRegion.uid)
                          : NO_REGION,
                  }
                : undefined,
        [tsutsyk, regionsData],
    );

    const { register, handleSubmit } = useForm<Values>({ values });

    const onSubmit = handleSubmit(async ({ alertDistanceMeters, alertRegionUid, photo }) => {
        const file = photo?.[0];
        const photoUrl = file ? await uploadTsutsykPhoto(tsutsykId, file) : undefined;

        await mutate({
            variables: {
                id: tsutsykId,
                alertDistanceMeters,
                photoUrl,
                // Explicitly null rather than undefined: the API treats an
                // absent field as "leave it alone", so clearing the region has
                // to be said out loud.
                alertRegionUid: alertRegionUid === NO_REGION ? null : Number(alertRegionUid),
            },
        });
    });

    const airRaid = tsutsyk ? AIR_RAID[tsutsyk.airRaidStatus] : null;

    return (
        <Stack as="form" gap={3} onSubmit={onSubmit}>
            <Field.Root>
                <AvatarUpload
                    {...register('photo')}
                    nickname={tsutsyk?.name ?? undefined}
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

            <Field.Root disabled>
                <Field.Label>Область для тривог (незабаром)</Field.Label>
                <NativeSelect.Root size="sm">
                    <NativeSelect.Field {...register('alertRegionUid')}>
                        <option value={NO_REGION}>Не стежити за тривогами</option>
                        {regions.map((region) => (
                            <option key={region.uid} value={String(region.uid)}>
                                {region.title}
                            </option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Field.HelperText>
                    Під час тривоги у вибраній області трекер оновлює позицію
                    щохвилини замість раз на 5 хвилин. Нижче 15% заряду —
                    залишається у звичайному режимі, щоб не сісти посеред тривоги.
                </Field.HelperText>
            </Field.Root>

            {airRaid && (
                <HStack gap="2" align="start">
                    <Badge colorPalette={airRaid.colorPalette} variant="subtle" rounded="full">
                        {airRaid.label}
                    </Badge>
                    <Text fontSize="xs" color="fg.muted">
                        {airRaid.detail}
                    </Text>
                </HStack>
            )}

            <Button type="submit" size="sm" colorPalette="blue" loading={saving}>
                Зберегти
            </Button>
        </Stack>
    );
};

export default TsutsykProfile;
