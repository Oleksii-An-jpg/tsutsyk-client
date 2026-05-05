import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
    schema: 'https://tsutsyk-api-538428844920.europe-central2.run.app/graphql',
    documents: "./app/_documents/**/*.ts",
    generates: {
        "./schema.graphql": {
            plugins: ["schema-ast"]
        },
        "app/_documents/__generated__/fragmentMatcher.codegen.ts": {
            plugins: ["fragment-matcher"],
        },
        "app/_documents/__generated__/globalTypes.codegen.ts": {
            plugins: ["typescript"],
            config: {
                inlineFragmentTypes: "combine",
                scalars: {
                    DateTime: {
                        input: 'string',
                        output: 'string'
                    },
                    Date: {
                        input: 'string',
                        output: 'string'
                    }
                }
            },
        },
        "app/_documents/__generated__/": {
            preset: "near-operation-file",
            presetConfig: {
                extension: ".codegen.ts",
                baseTypesPath: "globalTypes.codegen.ts",
                folder: "__generated__",
            },
            plugins: ["typescript-operations"],
            config: {
                inlineFragmentTypes: "combine",
                scalars: {
                    DateTime: {
                        input: 'string',
                        output: 'string'
                    },
                    Date: {
                        input: 'string',
                        output: 'string'
                    }
                }
            },
        },
    },
}
export default config