import { apiEndpoints } from '@/api/endpoints';
import { httpClient } from '@/api/http-client';
import type { EstateRecord, LandRecord, UploadTaskResponse } from '@/api/models';

interface UploadJsonPayload {
  land_records: LandRecord[];
  estate_records: EstateRecord[];
}

export const auditsApi = {
  uploadFiles(landFile: File, estateFile: File) {
    const formData = new FormData();
    formData.append('land_file', landFile);
    formData.append('estate_file', estateFile);

    return httpClient.post<UploadTaskResponse>(apiEndpoints.audits.upload, formData, { auth: true });
  },

  uploadJson(payload: UploadJsonPayload) {
    return httpClient.post<UploadTaskResponse>(apiEndpoints.audits.uploadJson, payload, { auth: true });
  },
};

