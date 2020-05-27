import { Item } from '../item';

export const merge = (target: any, ...objects: any): any => {
	for (const object of objects) {
		for (const key in object) {
			if (object.hasOwnProperty(key)) {
				// since we're dealing just with JSON this simple check should be enough
				if (object[key] instanceof Object) {
					if (!target[key]) {
						target[key] = {};
					}
					// recursively merge into the target
					// most translations only run 3 or 4 levels deep, so no stack explosions
					target[key] = merge(target[key], object[key]);
				} else {
					target[key] = object[key];
				}
			}
		}
	}
	return target;
};

export const filterByID = (data: Array<Item>, ids: Array<number>): Array<Item> => {
  if (ids) {
    return data.filter(item => { return ids.indexOf(item.id) != -1; });
  }
  return data;
};
