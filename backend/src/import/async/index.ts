// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any = {}): Promise<any> => {
    console.log(event);

    const result = await new Promise((resolve) => {
        setTimeout(()=>{
            resolve('hello world');
        }, 1000);
    });

    console.log(result);
};
