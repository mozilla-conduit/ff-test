/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  actionCreators as ac,
  actionTypes as at,
} from "../../common/Actions.mjs";

const _OpenInPrivateWindow = site => ({
  id: "newtab-menu-open-new-private-window",
  icon: "new-window-private",
  action: ac.OnlyToMain({
    type: at.OPEN_PRIVATE_WINDOW,
    data: { url: site.url, referrer: site.referrer },
  }),
  userEvent: "OPEN_PRIVATE_WINDOW",
});

/**
 * List of functions that return items that can be included as menu options in a
 * LinkMenu. All functions take the site as the first parameter, and optionally
 * the index of the site.
 */
export const LinkMenuOptions = {
  Separator: () => ({ type: "separator" }),
  EmptyItem: () => ({ type: "empty" }),
  ShowPrivacyInfo: () => ({
    id: "newtab-menu-show-privacy-info",
    icon: "info",
    action: {
      type: at.SHOW_PRIVACY_INFO,
    },
    userEvent: "SHOW_PRIVACY_INFO",
  }),
  AboutSponsored: site => ({
    id: "newtab-menu-show-privacy-info",
    icon: "info",
    action: ac.AlsoToMain({
      type: at.ABOUT_SPONSORED_TOP_SITES,
      data: {
        advertiser_name: (site.label || site.hostname).toLocaleLowerCase(),
        position: site.sponsored_position,
        tile_id: site.sponsored_tile_id,
        block_key: site.block_key,
      },
    }),
    userEvent: "TOPSITE_SPONSOR_INFO",
  }),
  RemoveBookmark: site => ({
    id: "newtab-menu-remove-bookmark",
    icon: "bookmark-added",
    action: ac.AlsoToMain({
      type: at.DELETE_BOOKMARK_BY_ID,
      data: site.bookmarkGuid,
    }),
    userEvent: "BOOKMARK_DELETE",
  }),
  AddBookmark: site => ({
    id: "newtab-menu-bookmark",
    icon: "bookmark-hollow",
    action: ac.AlsoToMain({
      type: at.BOOKMARK_URL,
      data: { url: site.url, title: site.title, type: site.type },
    }),
    userEvent: "BOOKMARK_ADD",
  }),
  OpenInNewWindow: site => ({
    id: "newtab-menu-open-new-window",
    icon: "new-window",
    action: ac.AlsoToMain({
      type: at.OPEN_NEW_WINDOW,
      data: {
        referrer: site.referrer,
        typedBonus: site.typedBonus,
        url: site.url,
        sponsored_tile_id: site.sponsored_tile_id,
      },
    }),
    userEvent: "OPEN_NEW_WINDOW",
  }),
  // This blocks the url for regular stories,
  // but also sends a message to DiscoveryStream with flight_id.
  // If DiscoveryStream sees this message for a flight_id
  // it also blocks it on the flight_id.
  BlockUrl: (site, index, eventSource) => {
    return LinkMenuOptions.BlockUrls([site], index, eventSource);
  },
  // Same as BlockUrl, cept can work on an array of sites.
  BlockUrls: (tiles, pos, eventSource) => ({
    id: "newtab-menu-dismiss",
    icon: "dismiss",
    action: ac.AlsoToMain({
      type: at.BLOCK_URL,
      data: tiles.map(site => ({
        url: site.original_url || site.open_url || site.url,
        // pocket_id is only for pocket stories being in highlights, and then dismissed.
        pocket_id: site.pocket_id,
        tile_id: site.tile_id,
        ...(site.block_key ? { block_key: site.block_key } : {}),
        recommendation_id: site.recommendation_id,
        scheduled_corpus_item_id: site.scheduled_corpus_item_id,
        corpus_item_id: site.corpus_item_id,
        received_rank: site.received_rank,
        recommended_at: site.recommended_at,
        // used by PlacesFeed and TopSitesFeed for sponsored top sites blocking.
        isSponsoredTopSite: site.sponsored_position,
        type: site.type,
        card_type: site.card_type,
        ...(site.shim && site.shim.delete ? { shim: site.shim.delete } : {}),
        ...(site.flight_id ? { flight_id: site.flight_id } : {}),
        // If not sponsored, hostname could be anything (Cat3 Data!).
        // So only put in advertiser_name for sponsored topsites.
        ...(site.sponsored_position
          ? {
              advertiser_name: (
                site.label || site.hostname
              )?.toLocaleLowerCase(),
            }
          : {}),
        position: pos,
        ...(site.sponsored_tile_id ? { tile_id: site.sponsored_tile_id } : {}),
        is_pocket_card: site.type === "CardGrid",
        is_list_card: site.is_list_card,
        ...(site.format ? { format: site.format } : {}),
        ...(site.section
          ? {
              section: site.section,
              section_position: site.section_position,
            }
          : {}),
      })),
    }),
    impression: ac.ImpressionStats({
      source: eventSource,
      block: 0,
      tiles: tiles.map((site, index) => ({
        id: site.guid,
        pos: pos + index,
        ...(site.shim && site.shim.delete ? { shim: site.shim.delete } : {}),
      })),
    }),
    userEvent: "BLOCK",
  }),

  // This is an option for web extentions which will result in remove items from
  // memory and notify the web extenion, rather than using the built-in block list.
  WebExtDismiss: (site, index, eventSource) => ({
    id: "menu_action_webext_dismiss",
    string_id: "newtab-menu-dismiss",
    icon: "dismiss",
    action: ac.WebExtEvent(at.WEBEXT_DISMISS, {
      source: eventSource,
      url: site.url,
      action_position: index,
    }),
  }),
  DeleteUrl: (site, index, eventSource, isEnabled, siteInfo) => ({
    id: "newtab-menu-delete-history",
    icon: "delete",
    action: {
      type: at.DIALOG_OPEN,
      data: {
        onConfirm: [
          ac.AlsoToMain({
            type: at.DELETE_HISTORY_URL,
            data: {
              url: site.url,
              pocket_id: site.pocket_id,
              forceBlock: site.bookmarkGuid,
            },
          }),
          ac.UserEvent(
            Object.assign(
              { event: "DELETE", source: eventSource, action_position: index },
              siteInfo
            )
          ),
        ],
        eventSource,
        body_string_id: [
          "newtab-confirm-delete-history-p1",
          "newtab-confirm-delete-history-p2",
        ],
        confirm_button_string_id: "newtab-topsites-delete-history-button",
        cancel_button_string_id: "newtab-topsites-cancel-button",
        icon: "modal-delete",
      },
    },
    userEvent: "DIALOG_OPEN",
  }),
  ShowFile: site => ({
    id: "newtab-menu-show-file",
    icon: "search",
    action: ac.OnlyToMain({
      type: at.SHOW_DOWNLOAD_FILE,
      data: { url: site.url },
    }),
  }),
  OpenFile: site => ({
    id: "newtab-menu-open-file",
    icon: "open-file",
    action: ac.OnlyToMain({
      type: at.OPEN_DOWNLOAD_FILE,
      data: { url: site.url },
    }),
  }),
  CopyDownloadLink: site => ({
    id: "newtab-menu-copy-download-link",
    icon: "copy",
    action: ac.OnlyToMain({
      type: at.COPY_DOWNLOAD_LINK,
      data: { url: site.url },
    }),
  }),
  GoToDownloadPage: site => ({
    id: "newtab-menu-go-to-download-page",
    icon: "download",
    action: ac.OnlyToMain({
      type: at.OPEN_LINK,
      data: { url: site.referrer },
    }),
    disabled: !site.referrer,
  }),
  RemoveDownload: site => ({
    id: "newtab-menu-remove-download",
    icon: "delete",
    action: ac.OnlyToMain({
      type: at.REMOVE_DOWNLOAD_FILE,
      data: { url: site.url },
    }),
  }),
  PinTopSite: (site, index) => ({
    id: "newtab-menu-pin",
    icon: "pin",
    action: ac.AlsoToMain({
      type: at.TOP_SITES_PIN,
      data: {
        site,
        index,
      },
    }),
    userEvent: "PIN",
  }),
  UnpinTopSite: site => ({
    id: "newtab-menu-unpin",
    icon: "unpin",
    action: ac.AlsoToMain({
      type: at.TOP_SITES_UNPIN,
      data: { site: { url: site.url } },
    }),
    userEvent: "UNPIN",
  }),
  SaveToPocket: (site, index, eventSource = "CARDGRID") => ({
    id: "newtab-menu-save-to-pocket",
    icon: "pocket-save",
    className: "stp-context-menu",
    action: ac.AlsoToMain({
      type: at.SAVE_TO_POCKET,
      data: {
        site: { url: site.url, title: site.title },
      },
    }),
    impression: ac.ImpressionStats({
      source: eventSource,
      pocket: 0,
      tiles: [
        {
          id: site.guid,
          pos: index,
          ...(site.shim && site.shim.save ? { shim: site.shim.save } : {}),
        },
      ],
    }),
    userEvent: "SAVE_TO_POCKET",
  }),
  DeleteFromPocket: site => ({
    id: "newtab-menu-delete-pocket",
    icon: "pocket-delete",
    action: ac.AlsoToMain({
      type: at.DELETE_FROM_POCKET,
      data: { pocket_id: site.pocket_id },
    }),
    userEvent: "DELETE_FROM_POCKET",
  }),
  ArchiveFromPocket: site => ({
    id: "newtab-menu-archive-pocket",
    icon: "pocket-archive",
    action: ac.AlsoToMain({
      type: at.ARCHIVE_FROM_POCKET,
      data: { pocket_id: site.pocket_id },
    }),
    userEvent: "ARCHIVE_FROM_POCKET",
  }),
  EditTopSite: (site, index) => ({
    id: "newtab-menu-edit-topsites",
    icon: "edit",
    action: {
      type: at.TOP_SITES_EDIT,
      data: { index },
    },
  }),
  CheckBookmark: site =>
    site.bookmarkGuid
      ? LinkMenuOptions.RemoveBookmark(site)
      : LinkMenuOptions.AddBookmark(site),
  CheckPinTopSite: (site, index) =>
    site.isPinned
      ? LinkMenuOptions.UnpinTopSite(site)
      : LinkMenuOptions.PinTopSite(site, index),
  CheckSavedToPocket: (site, index, source) =>
    site.pocket_id
      ? LinkMenuOptions.DeleteFromPocket(site)
      : LinkMenuOptions.SaveToPocket(site, index, source),
  CheckBookmarkOrArchive: site =>
    site.pocket_id
      ? LinkMenuOptions.ArchiveFromPocket(site)
      : LinkMenuOptions.CheckBookmark(site),
  CheckArchiveFromPocket: site =>
    site.pocket_id
      ? LinkMenuOptions.ArchiveFromPocket(site)
      : LinkMenuOptions.EmptyItem(),
  CheckDeleteFromPocket: site =>
    site.pocket_id
      ? LinkMenuOptions.DeleteFromPocket(site)
      : LinkMenuOptions.EmptyItem(),
  OpenInPrivateWindow: (site, index, eventSource, isEnabled) =>
    isEnabled ? _OpenInPrivateWindow(site) : LinkMenuOptions.EmptyItem(),
  ChangeWeatherLocation: () => ({
    id: "newtab-weather-menu-change-location",
    action: ac.BroadcastToContent({
      type: at.WEATHER_SEARCH_ACTIVE,
      data: true,
    }),
  }),
  ChangeWeatherDisplaySimple: () => ({
    id: "newtab-weather-menu-change-weather-display-simple",
    action: ac.OnlyToMain({
      type: at.SET_PREF,
      data: {
        name: "weather.display",
        value: "simple",
      },
    }),
  }),
  ChangeWeatherDisplayDetailed: () => ({
    id: "newtab-weather-menu-change-weather-display-detailed",
    action: ac.OnlyToMain({
      type: at.SET_PREF,
      data: {
        name: "weather.display",
        value: "detailed",
      },
    }),
  }),
  ChangeTempUnitFahrenheit: () => ({
    id: "newtab-weather-menu-change-temperature-units-fahrenheit",
    action: ac.OnlyToMain({
      type: at.SET_PREF,
      data: {
        name: "weather.temperatureUnits",
        value: "f",
      },
    }),
  }),
  ChangeTempUnitCelsius: () => ({
    id: "newtab-weather-menu-change-temperature-units-celsius",
    action: ac.OnlyToMain({
      type: at.SET_PREF,
      data: {
        name: "weather.temperatureUnits",
        value: "c",
      },
    }),
  }),
  HideWeather: () => ({
    id: "newtab-weather-menu-hide-weather",
    action: ac.OnlyToMain({
      type: at.SET_PREF,
      data: {
        name: "showWeather",
        value: false,
      },
    }),
  }),
  OpenLearnMoreURL: site => ({
    id: "newtab-weather-menu-learn-more",
    action: ac.OnlyToMain({
      type: at.OPEN_LINK,
      data: { url: site.url },
    }),
  }),
  FakespotDismiss: () => ({
    id: "newtab-menu-dismiss",
    action: ac.OnlyToMain({
      type: at.SET_PREF,
      data: {
        name: "discoverystream.contextualContent.fakespot.enabled",
        value: false,
      },
    }),
    impression: ac.OnlyToMain({
      type: at.FAKESPOT_DISMISS,
    }),
  }),
  AboutFakespot: site => ({
    id: "newtab-menu-about-fakespot",
    action: ac.OnlyToMain({
      type: at.OPEN_LINK,
      data: { url: site.url },
    }),
    impression: ac.OnlyToMain({
      type: at.OPEN_ABOUT_FAKESPOT,
    }),
  }),
  SectionBlock: () => ({
    id: "newtab-menu-section-block",
    // Note: action TBA. It will send a list of blocked sections back to the API.
    action: null,
    impression: ac.OnlyToMain({
      type: at.BLOCK_SECTION,
    }),
  }),
};
