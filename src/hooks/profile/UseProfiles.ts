import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { profileRepo } from "../../services/repositories/ProfileRepo";
import type { ProfileRow } from "../../models/types/ProfileTypes";

const useProfiles = (modalOpen: boolean) => {
    return useQuery<ProfileRow[]>({
        queryKey: ["profiles"],
        queryFn: async () => {
            return await profileRepo.list();
        },
        enabled: modalOpen,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export default useProfiles;
