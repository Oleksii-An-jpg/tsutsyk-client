'use client';

import {FC, ReactNode, useEffect, useId, useMemo, useState, useTransition} from "react";
import {
    Combobox,
    Field,
    NativeSelect,
    Portal,
    SimpleGrid,
    Spinner,
    Stack,
    Text,
    createListCollection,
} from "@chakra-ui/react";
import {Control, useController} from "react-hook-form";
import {useDebounceValue} from "usehooks-ts";
import {findSettlements, findWarehouses, listRegions} from "@/app/_actions/novaposhta";
import {Region} from "@/app/_lib/novaposhta/types";
import {DeliveryValues} from "@/app/_components/delivery-fields/types";

/** A Nova Poshta ref and the line that stands for it in the dropdown. */
type Option = {
    value: string;
    /** What the input shows and the form stores. */
    label: string;
    /** A quieter second line — the kind of settlement, a branch's address. */
    hint?: string;
};

/**
 * Stands in for a ref we do not have: the value an order was saved with
 * months ago, before this picker is told which settlement it came from.
 */
const KEPT = "kept";

/** Long enough that the list is worth opening, short enough to stay quiet. */
const MIN_QUERY_LENGTH = 2;

/** A keystroke is not a search. Nova Poshta rate-limits by key. */
const DEBOUNCE_MS = 300;

type AsyncComboboxProps = {
    label: string;
    placeholder: string;
    helperText?: ReactNode;
    /** Shown in place of the list when nothing matched. */
    emptyText: string;
    options: Option[];
    loading: boolean;
    disabled?: boolean;
    invalid?: boolean;
    errorText?: string;
    /** The label currently chosen — the value the form holds. */
    value: string;
    onBlur: () => void;
    onQueryChange: (query: string) => void;
    onPick: (option: Option | null) => void;
};

/**
 * A text box that searches somewhere else.
 *
 * Nova Poshta's directory is far too large to hand to the browser, so the
 * list is whatever the last search returned and the filtering has already
 * happened by the time it arrives. The buyer can only choose from it: typing
 * a branch that does not exist is the failure this whole feature is here to
 * prevent, so the input reverts to the last real choice when it loses focus.
 */
const AsyncCombobox: FC<AsyncComboboxProps> = ({
    label,
    placeholder,
    helperText,
    emptyText,
    options,
    loading,
    disabled,
    invalid,
    errorText,
    value,
    onBlur,
    onQueryChange,
    onPick,
}) => {
    const inputId = useId();

    // A value the order already had is a real choice even though no search
    // has turned it up: without an option to point at, the box would blank
    // itself the moment it lost focus.
    const items = useMemo<Option[]>(() => {
        const kept = value && !options.some((option) => option.label === value);
        return kept ? [{value: KEPT, label: value}, ...options] : options;
    }, [options, value]);

    const collection = useMemo(
        () =>
            createListCollection({
                items,
                itemToValue: (item: Option) => item.value,
                itemToString: (item: Option) => item.label,
            }),
        [items]
    );

    const selected = items.find((item) => item.label === value);

    return (
        <Field.Root required invalid={invalid} disabled={disabled}>
            <Field.Label htmlFor={inputId}>{label}</Field.Label>
            <Combobox.Root
                width="full"
                collection={collection}
                ids={{input: inputId}}
                value={selected ? [selected.value] : []}
                disabled={disabled}
                invalid={invalid}
                openOnClick
                inputBehavior="autohighlight"
                onValueChange={(details) => onPick(details.items[0] ?? null)}
                onInputValueChange={(details) => {
                    // The text is the combobox's own: it puts the chosen label
                    // back when the box loses focus, and picks one up from
                    // `value` whenever the form is reset from elsewhere. Only
                    // what the buyer typed is worth searching for.
                    if (details.reason === "input-change") onQueryChange(details.inputValue);
                }}
            >
                <Combobox.Control>
                    <Combobox.Input placeholder={placeholder} onBlur={onBlur} />
                    <Combobox.IndicatorGroup>
                        {loading ? <Spinner size="xs" borderWidth="1.5px" /> : <Combobox.ClearTrigger />}
                        <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                </Combobox.Control>
                <Portal>
                    <Combobox.Positioner>
                        {/* The list is portaled out to <body>, so it is not
                            under anything that has named a foreground for it.
                            `bg.panel` comes from the recipe; `fg` is its pair,
                            and saying it here keeps the labels legible however
                            the page outside happens to be painted. */}
                        <Combobox.Content color="fg" maxH="15rem" overflowY="auto">
                            <Combobox.Empty>{loading ? "Шукаємо…" : emptyText}</Combobox.Empty>
                            {items.map((item) => (
                                <Combobox.Item key={item.value} item={item}>
                                    <Stack gap={0}>
                                        <Combobox.ItemText>{item.label}</Combobox.ItemText>
                                        {item.hint && (
                                            <Text fontSize="xs" color="fg.muted">
                                                {item.hint}
                                            </Text>
                                        )}
                                    </Stack>
                                    <Combobox.ItemIndicator />
                                </Combobox.Item>
                            ))}
                        </Combobox.Content>
                    </Combobox.Positioner>
                </Portal>
            </Combobox.Root>
            {errorText ? (
                <Field.ErrorText>{errorText}</Field.ErrorText>
            ) : (
                helperText && <Field.HelperText>{helperText}</Field.HelperText>
            )}
        </Field.Root>
    );
};

type BranchPickerProps = {
    control: Control<DeliveryValues>;
    disabled?: boolean;
};

/**
 * Oblast, settlement, branch — the address as Nova Poshta knows it.
 *
 * The oblast is only a filter: settlement names repeat across the country,
 * and narrowing by one turns a list of eleven Іванівкas into the one the
 * buyer means. It is deliberately not part of the order — our API has no
 * field for it, and the settlement's own label already says which oblast it
 * is in.
 *
 * Both lists are searched on the server as the buyer types. The whole
 * directory is some tens of thousands of settlements and a hundred thousand
 * branches; Kyiv alone has more branches than anyone would scroll.
 */
const BranchPicker: FC<BranchPickerProps> = ({control, disabled}) => {
    const {field: city, fieldState: cityState} = useController({
        control,
        name: "city",
        rules: {required: "Оберіть населений пункт"},
    });
    const {field: branch, fieldState: branchState} = useController({
        control,
        name: "branch",
        rules: {required: "Оберіть відділення"},
    });

    const [regions, setRegions] = useState<Region[]>([]);
    const [areaRef, setAreaRef] = useState("");

    /** Nova Poshta's id for the chosen settlement — what the branches hang off. */
    const [settlementRef, setSettlementRef] = useState("");

    // Each list is kept beside the thing it was fetched for, so that the
    // moment the oblast or the settlement changes the stale one stops being
    // shown — without an effect having to reach in and empty it.
    const [found, setFound] = useState<{areaRef: string; options: Option[]}>({
        areaRef: "",
        options: [],
    });
    const [settlementQuery, setSettlementQuery] = useDebounceValue("", DEBOUNCE_MS);
    const [searchingSettlements, searchSettlements] = useTransition();

    const [branches, setBranches] = useState<{settlementRef: string; options: Option[]}>({
        settlementRef: "",
        options: [],
    });
    const [warehouseQuery, setWarehouseQuery] = useDebounceValue("", DEBOUNCE_MS);
    const [loadingBranches, loadBranches] = useTransition();

    const settlementOptions = found.areaRef === areaRef ? found.options : [];
    const warehouseOptions = branches.settlementRef === settlementRef ? branches.options : [];

    // Without either a search or an oblast this would be the first fifty
    // settlements in the country, which is not an answer to anything.
    const searchable = settlementQuery.length >= MIN_QUERY_LENGTH || !!areaRef;

    // The oblasts, once. A failure here costs the narrowing filter and
    // nothing else, so it is not worth telling the buyer about.
    useEffect(() => {
        let cancelled = false;
        listRegions()
            .then((loaded) => {
                if (!cancelled) setRegions(loaded);
            })
            .catch((error) => console.error("[novaposhta] could not load the oblasts", error));
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!searchable) return;

        let cancelled = false;
        searchSettlements(async () => {
            try {
                const matches = await findSettlements(areaRef, settlementQuery);
                if (cancelled) return;
                setFound({
                    areaRef,
                    options: matches.map((settlement) => ({
                        value: settlement.ref,
                        label: settlement.label,
                        hint: settlement.type,
                    })),
                });
            } catch (error) {
                console.error("[novaposhta] could not search settlements", error);
                if (!cancelled) setFound({areaRef, options: []});
            }
        });

        return () => {
            cancelled = true;
        };
    }, [areaRef, settlementQuery, searchable]);

    useEffect(() => {
        if (!settlementRef) return;

        let cancelled = false;
        loadBranches(async () => {
            try {
                const here = await findWarehouses(settlementRef, warehouseQuery);
                if (cancelled) return;
                setBranches({
                    settlementRef,
                    options: here.map((warehouse) => ({
                        value: warehouse.ref,
                        label: warehouse.description,
                        hint: warehouse.shortAddress,
                    })),
                });
            } catch (error) {
                console.error("[novaposhta] could not load the branches", error);
                if (!cancelled) setBranches({settlementRef, options: []});
            }
        });

        return () => {
            cancelled = true;
        };
    }, [settlementRef, warehouseQuery]);

    // An order opened weeks later has the city and the branch the buyer chose
    // then, and no trace of the refs behind them. Find the settlement again
    // so that correcting the branch does not mean re-picking the city too.
    useEffect(() => {
        const saved = city.value;
        if (!saved || settlementRef) return;

        let cancelled = false;
        findSettlements("", saved.split(",")[0])
            .then((found) => {
                const match = found.find((settlement) => settlement.label === saved);
                if (match && !cancelled) setSettlementRef(match.ref);
            })
            .catch((error) =>
                // Nothing is lost that picking the settlement again cannot fix.
                console.error("[novaposhta] could not place the saved settlement", error)
            );

        return () => {
            cancelled = true;
        };
    }, [city.value, settlementRef]);

    const pickRegion = (ref: string) => {
        setAreaRef(ref);
        // Whatever was chosen belongs to the oblast that was chosen before.
        setSettlementRef("");
        setSettlementQuery("");
        city.onChange("");
        branch.onChange("");
    };

    const pickSettlement = (option: Option | null) => {
        if (option?.value && option.value !== KEPT) setSettlementRef(option.value);
        if (!option) setSettlementRef("");

        city.onChange(option?.label ?? "");
        // The branch belonged to the settlement that is being replaced.
        branch.onChange("");
        setWarehouseQuery("");
    };

    return (
        <Stack gap={4}>
            <SimpleGrid columns={{base: 1, sm: 2}} gap={4}>
                <Field.Root disabled={disabled || regions.length === 0}>
                    <Field.Label>Область</Field.Label>
                    <NativeSelect.Root>
                        <NativeSelect.Field
                            value={areaRef}
                            onChange={(event) => pickRegion(event.currentTarget.value)}
                        >
                            <option value="">Уся Україна</option>
                            {regions.map((region) => (
                                <option key={region.ref} value={region.ref}>
                                    {region.label}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.HelperText>Щоб не шукати серед однойменних сіл</Field.HelperText>
                </Field.Root>

                <AsyncCombobox
                    label="Населений пункт"
                    placeholder="Почніть вводити назву"
                    helperText="Лише ті, куди їздить Нова пошта"
                    emptyText={
                        searchable
                            ? "Такого населеного пункту не знайшли"
                            : "Введіть кілька літер назви"
                    }
                    options={settlementOptions}
                    loading={searchingSettlements}
                    disabled={disabled}
                    invalid={!!cityState.error}
                    errorText={cityState.error?.message}
                    value={city.value}
                    onBlur={city.onBlur}
                    onQueryChange={setSettlementQuery}
                    onPick={pickSettlement}
                />
            </SimpleGrid>

            <AsyncCombobox
                label="Відділення"
                placeholder={city.value ? "Номер, вулиця або поштомат" : "Спершу оберіть населений пункт"}
                helperText="Відділення, вантажні відділення та поштомати"
                emptyText={
                    settlementRef
                        ? "Такого відділення тут немає"
                        : "Спершу оберіть населений пункт"
                }
                options={warehouseOptions}
                loading={loadingBranches}
                // Nothing to search until there is a settlement to search in.
                // An order being corrected keeps the branch it already has,
                // and stays editable while that settlement is looked back up.
                disabled={disabled || (!settlementRef && !branch.value)}
                invalid={!!branchState.error}
                errorText={branchState.error?.message}
                value={branch.value}
                onBlur={branch.onBlur}
                onQueryChange={setWarehouseQuery}
                onPick={(option) => branch.onChange(option?.label ?? "")}
            />
        </Stack>
    );
};

export default BranchPicker;
