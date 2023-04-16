interface File {
    name: string;
    content: string;
  }
  
  export interface UploadModelResponse {
    id: number;
    name: string;
  }
  
  export async function uploadModel(name: string, description: string, files: File[]): Promise<UploadModelResponse> {
    const response = await fetch("uri", {
      method: "POST",
      body: JSON.stringify({ name, description, files }),
    });
    if (response.status === 400) {
      const { reason } = await response.json();
      throw new Error(reason);
    }
    // return any success data
    const data: UploadModelResponse = await response.json();
    return data;
  }
  