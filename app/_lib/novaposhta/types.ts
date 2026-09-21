/**
 * Nova Poshta's address directory, in its words and in ours.
 *
 * Two shapes for each thing on purpose. The `Raw*` types are the API's own —
 * PascalCase, every value a string, and only the fields we actually read — so
 * that `app/_lib/novaposhta` is the one place that has to know how Nova
 * Poshta spells things. Everything above it sees the second kind.
 *
 * The `label` on a settlement and the `description` on a branch are not just
 * for the dropdown: they are what the order stores and what a human reads off
 * the parcel later, because our own API takes `city` and `branch` as plain
 * text. Refs never leave the picker.
 */

export type RawRegion = {
    Ref: string;
    Description: string;
    RegionType: string;
};

export type RawSettlement = {
    Ref: string;
    Description: string;
    SettlementTypeDescription: string;
    RegionsDescription: string;
    AreaDescription: string;
};

export type RawWarehouse = {
    Ref: string;
    Description: string;
    Number: string;
    ShortAddress: string;
    CategoryOfWarehouse: string;
    WarehouseStatus: string;
};

/** An oblast, as `getSettlementAreas` lists them. */
export type Region = {
    ref: string;
    /** "Вінницька область" — the name and its kind, put back together. */
    label: string;
};

/** A town or village Nova Poshta delivers to. */
export type Settlement = {
    ref: string;
    /** "Заболотів, Снятинський р-н, Івано-Франківська область". */
    label: string;
    /** "селище міського типу" — shown beside the label, never stored. */
    type: string;
};

/** A branch or a parcel locker in one settlement. */
export type Warehouse = {
    ref: string;
    /** "Відділення №1: вул. М. Грушевського, 3". */
    description: string;
    /** "Заболотів, М. Грушевського, 3" — shown beside the description. */
    shortAddress: string;
};
