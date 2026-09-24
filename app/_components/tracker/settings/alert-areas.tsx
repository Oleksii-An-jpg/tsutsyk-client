'use client';

import {FC} from 'react';
import {Button, HStack, IconButton, Stack, Switch, Text} from '@chakra-ui/react';
import {BiEditAlt, BiPlus, BiTrash} from 'react-icons/bi';
import {areaDraft} from '@/app/_lib/areaDraft';
import {useAlertAreas, useDeleteAlertArea, useUpdateAlertArea} from '@/app/_lib/useTracker';

/** The API refuses an eleventh; better the button says so first. */
const MAX_AREAS = 10;

type AlertAreasListProps = {
    tsutsykId: string;
    /** Drawing happens on the map, which the drawer covers. */
    onStartDrawing: () => void;
};

const AlertAreasList: FC<AlertAreasListProps> = ({ tsutsykId, onStartDrawing }) => {
    const { data } = useAlertAreas(tsutsykId);
    const areas = data?.getAlertAreas ?? [];
    const [update] = useUpdateAlertArea();
    const [remove] = useDeleteAlertArea();

    const draw = (draft: Parameters<typeof areaDraft>[0]) => {
        areaDraft(draft);
        onStartDrawing();
    };

    return (
        <Stack gap={2}>
            <Text fontWeight="medium" fontSize="sm">Зони</Text>
            <Text fontSize="xs" color="fg.muted">
                Коли цуцик вийде за межі всіх увімкнених зон, прийде сповіщення.
            </Text>

            {areas.map((area) => (
                <HStack key={area.id} justify="space-between" gap={2}>
                    <Switch.Root
                        size="sm"
                        checked={area.enabled}
                        onCheckedChange={({ checked }) =>
                            update({ variables: { tsutsykId, id: area.id, enabled: checked } })
                        }
                    >
                        <Switch.HiddenInput />
                        <Switch.Control />
                        <Switch.Label fontSize="sm" truncate>{area.name}</Switch.Label>
                    </Switch.Root>
                    <HStack gap={1}>
                        <IconButton
                            size="xs"
                            variant="ghost"
                            aria-label={`Змінити «${area.name}»`}
                            onClick={() => draw({
                                areaId: area.id,
                                name: area.name,
                                points: area.points.map(({ lat, lng }) => ({ lat, lng })),
                            })}
                        >
                            <BiEditAlt />
                        </IconButton>
                        <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            aria-label={`Видалити «${area.name}»`}
                            onClick={() => {
                                if (window.confirm(`Видалити зону «${area.name}»?`)) {
                                    return remove({ variables: { tsutsykId, id: area.id } });
                                }
                            }}
                        >
                            <BiTrash />
                        </IconButton>
                    </HStack>
                </HStack>
            ))}

            <Button
                size="xs"
                variant="outline"
                disabled={areas.length >= MAX_AREAS}
                onClick={() => draw({ areaId: null, name: `Зона ${areas.length + 1}`, points: [] })}
            >
                <BiPlus /> Додати зону
            </Button>
        </Stack>
    );
};

export default AlertAreasList;
