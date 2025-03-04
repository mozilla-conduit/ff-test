// |reftest| shell-option(--enable-explicit-resource-management) skip-if(!(this.hasOwnProperty('getBuildConfiguration')&&getBuildConfiguration('explicit-resource-management'))||!xulRuntime.shell) -- explicit-resource-management is not enabled unconditionally, requires shell-options
// Copyright (C) 2023 Ron Buckton. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-asyncdisposablestack
description: Default [[Prototype]] value derived from realm of the newTarget
info: |
  AsyncDisposableStack( )

  ...
  2. Let asyncDisposableStack be ? OrdinaryCreateFromConstructor(NewTarget, "%AsyncDisposableStack.prototype%", « [[AsyncDisposableState]], [[DisposeCapability]] »).
  3. Set asyncDisposableStack.[[AsyncDisposableState]] to pending.
  4. Set asyncDisposableStack.[[DisposeCapability]] to NewDisposeCapability().
  5. Return asyncDisposableStack.

  OrdinaryCreateFromConstructor ( constructor, intrinsicDefaultProto [ , internalSlotsList ] )

  ...
  2. Let proto be ? GetPrototypeFromConstructor(constructor, intrinsicDefaultProto).
  3. Return ObjectCreate(proto, internalSlotsList).

  GetPrototypeFromConstructor ( constructor, intrinsicDefaultProto )

  3. Let proto be ? Get(constructor, 'prototype').
  4. If Type(proto) is not Object, then
    a. Let realm be ? GetFunctionRealm(constructor).
    b. Set proto to realm's intrinsic object named intrinsicDefaultProto.
  5. Return proto.
features: [explicit-resource-management, cross-realm, Reflect, Symbol]
---*/

var other = $262.createRealm().global;
var newTarget = new other.Function();
var stack;

newTarget.prototype = undefined;
stack = Reflect.construct(AsyncDisposableStack, [], newTarget);
assert.sameValue(Object.getPrototypeOf(stack), other.AsyncDisposableStack.prototype, 'newTarget.prototype is undefined');

newTarget.prototype = null;
stack = Reflect.construct(AsyncDisposableStack, [], newTarget);
assert.sameValue(Object.getPrototypeOf(stack), other.AsyncDisposableStack.prototype, 'newTarget.prototype is null');

newTarget.prototype = true;
stack = Reflect.construct(AsyncDisposableStack, [], newTarget);
assert.sameValue(Object.getPrototypeOf(stack), other.AsyncDisposableStack.prototype, 'newTarget.prototype is a Boolean');

newTarget.prototype = '';
stack = Reflect.construct(AsyncDisposableStack, [], newTarget);
assert.sameValue(Object.getPrototypeOf(stack), other.AsyncDisposableStack.prototype, 'newTarget.prototype is a String');

newTarget.prototype = Symbol();
stack = Reflect.construct(AsyncDisposableStack, [], newTarget);
assert.sameValue(Object.getPrototypeOf(stack), other.AsyncDisposableStack.prototype, 'newTarget.prototype is a Symbol');

newTarget.prototype = 1;
stack = Reflect.construct(AsyncDisposableStack, [], newTarget);
assert.sameValue(Object.getPrototypeOf(stack), other.AsyncDisposableStack.prototype, 'newTarget.prototype is a Number');


reportCompare(0, 0);
