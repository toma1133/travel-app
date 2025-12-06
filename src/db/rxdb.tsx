import { addRxPlugin, createRxDatabase } from "rxdb/plugins/core";
import { getRxStorageLocalstorage } from "rxdb/plugins/storage-localstorage";
import tripSchema from "./tripSchema";
import { useEffect, useState } from "react";
import { wrappedValidateZSchemaStorage } from "rxdb/plugins/validate-z-schema";

type MyDatabase = any;
let dbPromise: Promise<MyDatabase> | null = null;

const storage = wrappedValidateZSchemaStorage({
    storage: getRxStorageLocalstorage(),
});

const initDB = async (): Promise<MyDatabase> => {
    if (!dbPromise) {
        if (import.meta.env.MODE === "development") {
            await import("rxdb/plugins/dev-mode").then((module) =>
                addRxPlugin(module.RxDBDevModePlugin)
            );
        }
        // 建立資料庫實例
        dbPromise = createRxDatabase({
            name: "travel_db_v1",
            storage,
            closeDuplicates: true,
        }).then(async (db: any) => {
            await db.addCollections({
                trips: { schema: tripSchema },
            });
            return db;
        });
    }
    return dbPromise;
};

const useRxDB = () => {
    const [db, setDb] = useState(null);

    useEffect(() => {
        initDB().then(setDb);
    }, []);

    return db;
};

export default useRxDB;
