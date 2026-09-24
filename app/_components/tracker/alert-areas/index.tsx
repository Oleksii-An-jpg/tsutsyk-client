'use client';

import {FC, useEffect, useState} from "react";
import {AdvancedMarker, Polygon, useMap} from "@vis.gl/react-google-maps";
import {useReactiveVar} from "@apollo/client/react";
import {Box, Button, HStack, Input, Stack, Text} from "@chakra-ui/react";
import {BiUndo} from "react-icons/bi";
import {areaDraft, AreaDraft} from "@/app/_lib/areaDraft";
import {useAlertAreas, useCreateAlertArea, useUpdateAlertArea} from "@/app/_lib/useTracker";

// Mirrors the API's own limits, so the button can say no before the server has to.
const MIN_POINTS = 3;
const MAX_POINTS = 100;
const MAX_NAME_LENGTH = 40;

const AREA_COLOR = "#2b7fff";
const PAUSED_COLOR = "#a1a1aa";
const DRAFT_COLOR = "#f97316";

type AlertAreasProps = {
    tsutsykId: string;
};

/**
 * The owner's alert areas, drawn on the map — and, while one is being drawn,
 * the thing that turns taps on the map into its corners.
 */
const AlertAreas: FC<AlertAreasProps> = ({ tsutsykId }) => {
    const { data } = useAlertAreas(tsutsykId);
    const draft = useReactiveVar(areaDraft);
    const areas = data?.getAlertAreas ?? [];

    return <>
        {areas
            // The area being redrawn is shown as the draft instead, not twice.
            .filter((area) => area.id !== draft?.areaId)
            .map((area) => (
                <Polygon
                    key={area.id}
                    paths={area.points}
                    strokeColor={area.enabled ? AREA_COLOR : PAUSED_COLOR}
                    strokeWeight={2}
                    fillColor={area.enabled ? AREA_COLOR : PAUSED_COLOR}
                    fillOpacity={0.1}
                    // Taps have to fall through to the map, or a corner could
                    // never be placed inside an area that already exists.
                    clickable={false}
                />
            ))}
        {draft && <DraftEditor tsutsykId={tsutsykId} draft={draft} />}
    </>;
};

const DraftEditor: FC<{ tsutsykId: string; draft: AreaDraft }> = ({ tsutsykId, draft }) => {
    const map = useMap();
    const [create, { loading: creating }] = useCreateAlertArea();
    const [update, { loading: updating }] = useUpdateAlertArea();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!map) return;
        const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
            const latLng = event.latLng?.toJSON();
            const current = areaDraft();
            if (!latLng || !current || current.points.length >= MAX_POINTS) return;
            areaDraft({ ...current, points: [...current.points, latLng] });
        });
        return () => listener.remove();
    }, [map]);

    const moveCorner = (index: number, latLng: google.maps.LatLngLiteral) => {
        areaDraft({
            ...draft,
            points: draft.points.map((point, i) => (i === index ? latLng : point)),
        });
    };

    const name = draft.name.trim();
    const canSave = draft.points.length >= MIN_POINTS && name.length > 0;
    const saving = creating || updating;

    const save = async () => {
        setError(null);
        try {
            if (draft.areaId) {
                await update({
                    variables: { tsutsykId, id: draft.areaId, name, points: draft.points },
                });
            } else {
                await create({ variables: { tsutsykId, name, points: draft.points } });
            }
            areaDraft(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не вдалося зберегти зону');
        }
    };

    return <>
        {draft.points.length > 0 && (
            <Polygon
                paths={draft.points}
                strokeColor={DRAFT_COLOR}
                strokeWeight={2}
                fillColor={DRAFT_COLOR}
                fillOpacity={0.15}
                clickable={false}
            />
        )}
        {draft.points.map((point, index) => (
            <AdvancedMarker
                key={index}
                position={point}
                draggable
                onDragEnd={(event) => {
                    const latLng = event.latLng?.toJSON();
                    if (latLng) moveCorner(index, latLng);
                }}
                // Centred on the corner itself, not standing on it like a pin.
                anchorLeft="-50%"
                anchorTop="-50%"
            >
                <Box
                    boxSize="4"
                    rounded="full"
                    bg="white"
                    borderWidth="3px"
                    borderColor="orange.500"
                    boxShadow="sm"
                />
            </AdvancedMarker>
        ))}
        {/* Clear of the controls in the bottom-right corner. */}
        <Box className="fixed bottom-4 left-4" right="16" maxW="22rem">
            <Stack gap="2" bg="bg.panel" p="3" rounded="l3" boxShadow="lg">
                <Input
                    size="sm"
                    value={draft.name}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="Назва зони"
                    onChange={(e) => areaDraft({ ...draft, name: e.target.value })}
                />
                <Text fontSize="xs" color="fg.muted">
                    {draft.points.length < MIN_POINTS
                        ? `Торкайтеся мапи, щоб поставити кути зони — ще ${MIN_POINTS - draft.points.length}.`
                        : 'Кути можна перетягувати. Коли цуцик вийде за межі всіх зон, прийде сповіщення.'}
                </Text>
                {error && <Text fontSize="xs" color="fg.error">{error}</Text>}
                <HStack justify="space-between">
                    <Button size="xs" variant="ghost" onClick={() => areaDraft(null)} disabled={saving}>
                        Скасувати
                    </Button>
                    <HStack gap="2">
                        <Button
                            size="xs"
                            variant="outline"
                            aria-label="Прибрати останній кут"
                            disabled={draft.points.length === 0 || saving}
                            onClick={() => areaDraft({ ...draft, points: draft.points.slice(0, -1) })}
                        >
                            <BiUndo />
                        </Button>
                        <Button size="xs" colorPalette="blue" disabled={!canSave} loading={saving} onClick={save}>
                            Зберегти
                        </Button>
                    </HStack>
                </HStack>
            </Stack>
        </Box>
    </>;
};

export default AlertAreas;
