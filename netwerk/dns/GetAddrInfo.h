/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef netwerk_dns_GetAddrInfo_h
#define netwerk_dns_GetAddrInfo_h

#include "nsError.h"
#include "nscore.h"
#include "nsINativeDNSResolverOverride.h"
#include "nsHashKeys.h"
#include "nsTHashMap.h"
#include "mozilla/RWLock.h"
#include "nsTArray.h"
#include "prio.h"
#include "mozilla/net/DNS.h"
#include "nsIDNSByTypeRecord.h"
#include "mozilla/Logging.h"
#include "nsIDNSService.h"

#if defined(XP_WIN)
#  define DNSQUERY_AVAILABLE 1
#else
#  undef DNSQUERY_AVAILABLE
#endif

namespace mozilla {
namespace net {

extern LazyLogModule gGetAddrInfoLog;
class AddrInfo;
class DNSPacket;

/**
 * Look up a host by name. Mostly equivalent to getaddrinfo(host, NULL, ...) of
 * RFC 3493.
 *
 * @param aHost[in] Character string defining the host name of interest
 * @param aAddressFamily[in] May be AF_INET, AF_INET6, or AF_UNSPEC.
 * @param aFlags[in] See nsIDNSService::DNSFlags
 * @param aAddrInfo[out] Will point to the results of the host lookup, or be
 *     null if the lookup failed.
 * @param aGetTtl[in] If true, the TTL will be retrieved if DNS provides the
 *     answers..
 */
nsresult GetAddrInfo(const nsACString& aHost, uint16_t aAddressFamily,
                     nsIDNSService::DNSFlags aFlags, AddrInfo** aAddrInfo,
                     bool aGetTtl);

/**
 * Initialize the GetAddrInfo module.
 *
 * GetAddrInfoShutdown() should be called for every time this function is
 * called.
 */
nsresult GetAddrInfoInit();

/**
 * Shutdown the GetAddrInfo module.
 *
 * This function should be called for every time GetAddrInfoInit() is called.
 * An assertion may throw (but is not guarenteed) if this function is called
 * too many times.
 */
nsresult GetAddrInfoShutdown();

void DNSThreadShutdown();

/**
 * Resolves a HTTPS record. Will check overrides before calling the
 * native OS implementation.
 */
nsresult ResolveHTTPSRecord(const nsACString& aHost,
                            nsIDNSService::DNSFlags aFlags,
                            TypeRecordResultType& aResult, uint32_t& aTTL);

/**
 * The platform specific implementation of HTTPS resolution.
 */
nsresult ResolveHTTPSRecordImpl(const nsACString& aHost,
                                nsIDNSService::DNSFlags aFlags,
                                TypeRecordResultType& aResult, uint32_t& aTTL);

nsresult ParseHTTPSRecord(nsCString& aHost, DNSPacket& aDNSPacket,
                          TypeRecordResultType& aResult, uint32_t& aTTL);

// Use the provided aHost to create a mock HTTPS record.
nsresult CreateAndResolveMockHTTPSRecord(const nsACString& aHost,
                                         nsIDNSService::DNSFlags aFlags,
                                         TypeRecordResultType& aResult,
                                         uint32_t& aTTL);

class NativeDNSResolverOverride : public nsINativeDNSResolverOverride {
  NS_DECL_THREADSAFE_ISUPPORTS
  NS_DECL_NSINATIVEDNSRESOLVEROVERRIDE
 public:
  NativeDNSResolverOverride() = default;

  static already_AddRefed<nsINativeDNSResolverOverride> GetSingleton();

 private:
  virtual ~NativeDNSResolverOverride() = default;
  mozilla::RWLock mLock{"NativeDNSResolverOverride"};

  nsTHashMap<nsCStringHashKey, nsTArray<NetAddr>> mOverrides
      MOZ_GUARDED_BY(mLock);
  nsTHashMap<nsCStringHashKey, nsCString> mCnames MOZ_GUARDED_BY(mLock);
  nsTHashMap<nsCStringHashKey, nsTArray<uint8_t>> mHTTPSRecordOverrides
      MOZ_GUARDED_BY(mLock);

  friend bool FindAddrOverride(const nsACString& aHost, uint16_t aAddressFamily,
                               nsIDNSService::DNSFlags aFlags,
                               AddrInfo** aAddrInfo);
  friend bool FindHTTPSRecordOverride(const nsACString& aHost,
                                      TypeRecordResultType& aResult);
};

}  // namespace net
}  // namespace mozilla

#endif  // netwerk_dns_GetAddrInfo_h
