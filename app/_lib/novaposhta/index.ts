import {Region, RawRegion} from "@/app/_lib/novaposhta/types";

class Novaposhta {
    private static base = 'https://api.novaposhta.ua/v2.0/json/'
    public async regions(): Promise<Region[]> {
        const data = await fetch(Novaposhta.base, {
            method: 'POST',
            body: JSON.stringify({
                apiKey: process.env.NOVAPOSHTA_API_KEY,
                modelName: 'AddressGeneral',
                "calledMethod": "getSettlementAreas",
                "methodProperties": {
                    "Ref": ""
                }
            })
        })
        const json = await data.json();

        return json.data.map((raw: RawRegion) => ({
            ref: raw.Ref,
            description: raw.Description,
            type: raw.RegionType,
            areasCenter: raw.AreasCenter,
        }))
    }
}

export const novaposhta = new Novaposhta();
