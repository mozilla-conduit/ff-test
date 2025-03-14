/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "mozilla/glean/bindings/Counter.h"

#include "nsString.h"
#include "mozilla/ResultVariant.h"
#include "mozilla/dom/GleanMetricsBinding.h"
#include "mozilla/glean/bindings/HistogramGIFFTMap.h"
#include "mozilla/glean/bindings/ScalarGIFFTMap.h"
#include "mozilla/glean/fog_ffi_generated.h"
#include "GIFFTFwd.h"

namespace mozilla::glean {

namespace impl {

void CounterMetric::Add(int32_t aAmount) const {
  auto scalarId = ScalarIdForMetric(mId);
  if (aAmount >= 0) {
    if (scalarId) {
      TelemetryScalar::Add(scalarId.extract(), aAmount);
    } else if (IsSubmetricId(mId)) {
      bool mirrorsToKeyedScalar = false;
      GetLabeledMirrorLock().apply([&](const auto& lock) {
        auto tuple = lock.ref()->MaybeGet(mId);
        mirrorsToKeyedScalar = !!tuple;
        if (tuple && aAmount > 0) {
          TelemetryScalar::Add(std::get<0>(tuple.ref()),
                               std::get<1>(tuple.ref()), (uint32_t)aAmount);
        }
      });
      if (!mirrorsToKeyedScalar) {
        GetLabeledDistributionMirrorLock().apply([&](const auto& lock) {
          auto tuple = lock.ref()->MaybeGet(mId);
          if (tuple) {
            MOZ_ASSERT(aAmount == 1,
                       "When mirroring to boolean histograms, we only support "
                       "accumulating one sample at a time.");
            auto& label = std::get<1>(tuple.ref());
            if (label.EqualsASCII("true")) {
              Telemetry::Accumulate(std::get<0>(tuple.ref()), true);
            } else if (label.EqualsASCII("false")) {
              Telemetry::Accumulate(std::get<0>(tuple.ref()), false);
            } else {
              MOZ_ASSERT_UNREACHABLE(
                  "When mirroring to boolean histograms, we only support "
                  "labels 'true' and 'false'");
            }
          }
        });
      }
    } else {
      auto hgramId = HistogramIdForMetric(mId);
      if (hgramId) {
        Telemetry::Accumulate(hgramId.extract(), aAmount);
      }
    }
  }
  fog_counter_add(mId, aAmount);
}

Result<Maybe<int32_t>, nsCString> CounterMetric::TestGetValue(
    const nsACString& aPingName) const {
  nsCString err;
  if (fog_counter_test_get_error(mId, &err)) {
    return Err(err);
  }
  if (!fog_counter_test_has_value(mId, &aPingName)) {
    return Maybe<int32_t>();  // can't use Nothing() or templates will fail.
  }
  return Some(fog_counter_test_get_value(mId, &aPingName));
}

}  // namespace impl

/* virtual */
JSObject* GleanCounter::WrapObject(JSContext* aCx,
                                   JS::Handle<JSObject*> aGivenProto) {
  return dom::GleanCounter_Binding::Wrap(aCx, this, aGivenProto);
}

void GleanCounter::Add(int32_t aAmount) { mCounter.Add(aAmount); }

dom::Nullable<int32_t> GleanCounter::TestGetValue(const nsACString& aPingName,
                                                  ErrorResult& aRv) {
  dom::Nullable<int32_t> ret;
  auto result = mCounter.TestGetValue(aPingName);
  if (result.isErr()) {
    aRv.ThrowDataError(result.unwrapErr());
    return ret;
  }
  auto optresult = result.unwrap();
  if (!optresult.isNothing()) {
    ret.SetValue(optresult.value());
  }
  return ret;
}

}  // namespace mozilla::glean
