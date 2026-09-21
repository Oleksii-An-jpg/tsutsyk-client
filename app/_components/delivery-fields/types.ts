/**
 * What the two delivery forms hold.
 *
 * Kept out of the component file so the branch picker can name the shape it
 * writes into without importing the component that renders it.
 *
 * `city` and `branch` are the text our own API stores, not Nova Poshta's
 * identifiers: `DeliveryInput` takes them as plain strings, and the person
 * putting the parcel together reads them off the order. The picker is what
 * makes sure the text is Nova Poshta's own rather than something remembered
 * — the refs it works with never leave it.
 */
export type DeliveryValues = {
    recipientName: string;
    phone: string;
    city: string;
    branch: string;
    comment: string;
};
