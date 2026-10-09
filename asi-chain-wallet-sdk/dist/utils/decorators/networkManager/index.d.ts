import { NetworkId } from "@domains/Network";
export declare function EnsureNetworkIsIdle<This, Args extends [NetworkId, ...any[]], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
