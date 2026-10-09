export interface IDateParts {
    dateTime?: string;
    date: string;
    time: string;
}

export const formatDateParts = (timestamp: string): IDateParts => {
    const parsed = new Date(timestamp);

    return Number.isNaN(parsed.getTime())
        ? { date: "—", time: "" }
        : {
              dateTime: parsed.toISOString(),
              date: parsed.toLocaleDateString(),
              time: parsed.toLocaleTimeString(),
          };
};
