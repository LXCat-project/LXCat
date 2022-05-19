export function query2array(set_name: string | string[] | undefined): string[] {
    if (set_name) {
        if (typeof set_name === 'string') {
            return [set_name];
        } else {
            return set_name;
        }
    } else {
        return [];
    }
}
