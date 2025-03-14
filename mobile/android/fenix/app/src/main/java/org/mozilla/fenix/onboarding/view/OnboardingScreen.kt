/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

@file:OptIn(ExperimentalFoundationApi::class)

package org.mozilla.fenix.onboarding.view

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import mozilla.components.compose.base.annotation.LightDarkPreview
import mozilla.components.lib.state.ext.observeAsComposableState
import org.mozilla.fenix.R
import org.mozilla.fenix.components.components
import org.mozilla.fenix.compose.LinkTextState
import org.mozilla.fenix.compose.PagerIndicator
import org.mozilla.fenix.onboarding.WidgetPinnedReceiver.WidgetPinnedState
import org.mozilla.fenix.onboarding.store.OnboardingAction
import org.mozilla.fenix.onboarding.store.OnboardingAction.OnboardingThemeAction
import org.mozilla.fenix.onboarding.store.OnboardingAction.OnboardingToolbarAction
import org.mozilla.fenix.onboarding.store.OnboardingStore
import org.mozilla.fenix.theme.FirefoxTheme

/**
 * A screen for displaying onboarding.
 *
 * @param pagesToDisplay List of pages to be displayed in onboarding pager ui.
 * @param onMakeFirefoxDefaultClick Invoked when positive button on default browser page is clicked.
 * @param onSkipDefaultClick Invoked when negative button on default browser page is clicked.
 * @param onSignInButtonClick Invoked when the positive button on the sign in page is clicked.
 * @param onSkipSignInClick Invoked when the negative button on the sign in page is clicked.
 * @param onNotificationPermissionButtonClick Invoked when positive button on notification page is
 * clicked.
 * @param onSkipNotificationClick Invoked when negative button on notification page is clicked.
 * @param onAddFirefoxWidgetClick Invoked when positive button on add search widget page is clicked.
 * @param onSkipFirefoxWidgetClick Invoked when negative button on add search widget page is clicked.
 * @param onboardingStore The store which contains all the state related to the add-ons onboarding screen.
 * @param onAddOnsButtonClick Invoked when the primary button on add-ons page is clicked.
 * @param onInstallAddOnButtonClick Invoked when a button for installing an add-on is clicked.
 * @param termsOfServiceEventHandler Invoked when the primary button on the terms of service page is clicked.
 * @param onCustomizeToolbarClick Invoked when positive button customize toolbar page is clicked.
 * @param onSkipCustomizeToolbarClick Invoked when negative button on customize toolbar page is clicked.
 * @param onCustomizeThemeClick Invoked when the primary button on the theme selection page is clicked.
 * @param onCustomizeThemeSkip Invoked when the skip button on the theme selection page is clicked.
 * @param onFinish Invoked when the onboarding is completed.
 * @param onImpression Invoked when a page in the pager is displayed.
 */
@Composable
@Suppress("LongParameterList", "LongMethod")
fun OnboardingScreen(
    pagesToDisplay: List<OnboardingPageUiData>,
    onMakeFirefoxDefaultClick: () -> Unit,
    onSkipDefaultClick: () -> Unit,
    onSignInButtonClick: () -> Unit,
    onSkipSignInClick: () -> Unit,
    onNotificationPermissionButtonClick: () -> Unit,
    onSkipNotificationClick: () -> Unit,
    onAddFirefoxWidgetClick: () -> Unit,
    onSkipFirefoxWidgetClick: () -> Unit,
    onboardingStore: OnboardingStore? = null,
    onAddOnsButtonClick: () -> Unit,
    onInstallAddOnButtonClick: (AddOn) -> Unit,
    termsOfServiceEventHandler: OnboardingTermsOfServiceEventHandler,
    onCustomizeToolbarClick: () -> Unit,
    onSkipCustomizeToolbarClick: () -> Unit,
    onCustomizeThemeClick: () -> Unit,
    onCustomizeThemeSkip: () -> Unit,
    onFinish: (pageType: OnboardingPageUiData) -> Unit,
    onImpression: (pageType: OnboardingPageUiData) -> Unit,
) {
    val coroutineScope = rememberCoroutineScope()
    val pagerState = rememberPagerState(pageCount = { pagesToDisplay.size })
    val isSignedIn: State<Boolean?> = components.backgroundServices.syncStore
        .observeAsComposableState { it.account != null }
    val widgetPinnedFlow: StateFlow<Boolean> = WidgetPinnedState.isPinned
    val isWidgetPinnedState by widgetPinnedFlow.collectAsState()

    BackHandler(enabled = pagerState.currentPage > 0) {
        coroutineScope.launch {
            pagerState.animateScrollToPage(pagerState.currentPage - 1)
        }
    }

    val scrollToNextPageOrDismiss: () -> Unit = {
        if (pagerState.currentPage >= pagesToDisplay.lastIndex) {
            onFinish(pagesToDisplay[pagesToDisplay.lastIndex])
        } else {
            coroutineScope.launch {
                pagerState.animateScrollToPage(pagerState.currentPage + 1)
            }
        }
    }

    val hasScrolledToNextPage = remember { mutableStateOf(false) }

    LaunchedEffect(isSignedIn.value, isWidgetPinnedState) {
        if ((isSignedIn.value == true || isWidgetPinnedState) && !hasScrolledToNextPage.value) {
            scrollToNextPageOrDismiss()
            hasScrolledToNextPage.value = true
        }
    }

    LaunchedEffect(pagerState) {
        snapshotFlow { pagerState.currentPage }.collect { page ->
            onImpression(pagesToDisplay[page])
        }
    }

    OnboardingContent(
        pagesToDisplay = pagesToDisplay,
        pagerState = pagerState,
        onMakeFirefoxDefaultClick = {
            scrollToNextPageOrDismiss()
            onMakeFirefoxDefaultClick()
        },
        onMakeFirefoxDefaultSkipClick = {
            scrollToNextPageOrDismiss()
            onSkipDefaultClick()
        },
        onSignInButtonClick = {
            onSignInButtonClick()
            scrollToNextPageOrDismiss()
        },
        onSignInSkipClick = {
            scrollToNextPageOrDismiss()
            onSkipSignInClick()
        },
        onNotificationPermissionButtonClick = {
            scrollToNextPageOrDismiss()
            onNotificationPermissionButtonClick()
        },
        onNotificationPermissionSkipClick = {
            scrollToNextPageOrDismiss()
            onSkipNotificationClick()
        },
        onAddFirefoxWidgetClick = {
            if (isWidgetPinnedState) {
                scrollToNextPageOrDismiss()
            } else {
                onAddFirefoxWidgetClick()
            }
        },
        onSkipFirefoxWidgetClick = {
            scrollToNextPageOrDismiss()
            onSkipFirefoxWidgetClick()
        },
        onAddOnsButtonClick = {
            scrollToNextPageOrDismiss()
            onAddOnsButtonClick()
        },
        onInstallAddOnButtonClick = onInstallAddOnButtonClick,
        onCustomizeToolbarButtonClick = {
            scrollToNextPageOrDismiss()
            onCustomizeToolbarClick()
        },
        onCustomizeToolbarSkipClick = {
            scrollToNextPageOrDismiss()
            onSkipCustomizeToolbarClick()
        },
        onCustomizeThemeButtonClick = {
            scrollToNextPageOrDismiss()
            onCustomizeThemeClick()
        },
        onCustomizeThemeButtonSkip = {
            scrollToNextPageOrDismiss()
            onCustomizeThemeSkip()
        },
        termsOfServiceEventHandler = termsOfServiceEventHandler,
        onAgreeAndConfirmTermsOfService = {
            scrollToNextPageOrDismiss()
            termsOfServiceEventHandler.onAcceptTermsButtonClicked()
        },
        onboardingStore = onboardingStore,
    )
}

@Composable
@Suppress("LongParameterList")
private fun OnboardingContent(
    pagesToDisplay: List<OnboardingPageUiData>,
    pagerState: PagerState,
    onMakeFirefoxDefaultClick: () -> Unit,
    onMakeFirefoxDefaultSkipClick: () -> Unit,
    onSignInButtonClick: () -> Unit,
    onSignInSkipClick: () -> Unit,
    onNotificationPermissionButtonClick: () -> Unit,
    onNotificationPermissionSkipClick: () -> Unit,
    onAddFirefoxWidgetClick: () -> Unit,
    onSkipFirefoxWidgetClick: () -> Unit,
    onboardingStore: OnboardingStore? = null,
    onAddOnsButtonClick: () -> Unit,
    onInstallAddOnButtonClick: (AddOn) -> Unit,
    onCustomizeToolbarButtonClick: () -> Unit,
    onCustomizeToolbarSkipClick: () -> Unit,
    onCustomizeThemeButtonClick: () -> Unit,
    onCustomizeThemeButtonSkip: () -> Unit,
    termsOfServiceEventHandler: OnboardingTermsOfServiceEventHandler,
    onAgreeAndConfirmTermsOfService: () -> Unit,
) {
    val nestedScrollConnection = remember { DisableForwardSwipeNestedScrollConnection(pagerState) }

    Column(
        modifier = Modifier
            .background(FirefoxTheme.colors.layer1)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        HorizontalPager(
            state = pagerState,
            key = { pagesToDisplay[it].type },
            modifier = Modifier
                .weight(1f)
                .nestedScroll(nestedScrollConnection),
        ) { pageIndex ->
            val pageUiState = pagesToDisplay[pageIndex]
            val onboardingPageState = mapToOnboardingPageState(
                onboardingPageUiData = pageUiState,
                onMakeFirefoxDefaultClick = onMakeFirefoxDefaultClick,
                onMakeFirefoxDefaultSkipClick = onMakeFirefoxDefaultSkipClick,
                onSignInButtonClick = onSignInButtonClick,
                onSignInSkipClick = onSignInSkipClick,
                onNotificationPermissionButtonClick = onNotificationPermissionButtonClick,
                onNotificationPermissionSkipClick = onNotificationPermissionSkipClick,
                onAddFirefoxWidgetClick = onAddFirefoxWidgetClick,
                onAddFirefoxWidgetSkipClick = onSkipFirefoxWidgetClick,
                onAddOnsButtonClick = onAddOnsButtonClick,
                onCustomizeToolbarButtonClick = onCustomizeToolbarButtonClick,
                onCustomizeToolbarSkipClick = onCustomizeToolbarSkipClick,
                onCustomizeThemeClick = onCustomizeThemeButtonClick,
                onCustomizeThemeSkip = onCustomizeThemeButtonSkip,
                onTermsOfServiceButtonClick = onAgreeAndConfirmTermsOfService,
            )
            OnboardingPageForType(
                type = pageUiState.type,
                state = onboardingPageState,
                onboardingStore = onboardingStore,
                termsOfServiceEventHandler = termsOfServiceEventHandler,
                onInstallAddOnButtonClick = onInstallAddOnButtonClick,
            )
        }

        PagerIndicator(
            pagerState = pagerState,
            activeColor = FirefoxTheme.colors.actionPrimary,
            inactiveColor = FirefoxTheme.colors.actionSecondary,
            leaveTrail = true,
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .padding(bottom = 16.dp),
        )
    }
}

@Composable
private fun OnboardingPageForType(
    type: OnboardingPageUiData.Type,
    state: OnboardingPageState,
    onboardingStore: OnboardingStore? = null,
    termsOfServiceEventHandler: OnboardingTermsOfServiceEventHandler,
    onInstallAddOnButtonClick: (AddOn) -> Unit,
) {
    when (type) {
        OnboardingPageUiData.Type.DEFAULT_BROWSER,
        OnboardingPageUiData.Type.SYNC_SIGN_IN,
        OnboardingPageUiData.Type.ADD_SEARCH_WIDGET,
        OnboardingPageUiData.Type.NOTIFICATION_PERMISSION,
        -> OnboardingPage(state)

        OnboardingPageUiData.Type.TOOLBAR_PLACEMENT,
        -> onboardingStore?.let { store ->
            ToolbarOnboardingPage(
                onboardingStore = store,
                pageState = state,
                onToolbarSelectionClicked = {
                    store.dispatch(OnboardingToolbarAction.UpdateSelected(it))
                },
            )
        }

        OnboardingPageUiData.Type.THEME_SELECTION,
        -> onboardingStore?.let { store ->
            ThemeOnboardingPage(
                onboardingStore = store,
                pageState = state,
                onThemeSelectionClicked = {
                    store.dispatch(OnboardingThemeAction.UpdateSelected(it))
                },
            )
        }

        OnboardingPageUiData.Type.ADD_ONS,
        -> onboardingStore?.let { store ->
            state.addOns?.let { addOns ->
                store.dispatch(OnboardingAction.Init(addOns))
            }
            AddOnsOnboardingPage(store, state, onInstallAddOnButtonClick)
        }

        OnboardingPageUiData.Type.TERMS_OF_SERVICE -> TermsOfServiceOnboardingPage(
            state,
            termsOfServiceEventHandler,
        )
    }
}

private class DisableForwardSwipeNestedScrollConnection(
    private val pagerState: PagerState,
) : NestedScrollConnection {

    override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset =
        if (available.x > 0) {
            // Allow going back on swipe
            Offset.Zero
        } else {
            // For forward swipe, only allow if the visible item offset is less than 0,
            // this would be a result of a slow back fling, and we should allow snapper to
            // snap to the appropriate item.
            // Else consume the whole offset and disable going forward.
            if (pagerState.currentPageOffsetFraction < 0) {
                Offset.Zero
            } else {
                Offset(available.x, 0f)
            }
        }
}

@LightDarkPreview
@Composable
private fun OnboardingScreenPreview() {
    val pageCount = defaultPreviewPages().size
    FirefoxTheme {
        OnboardingContent(
            pagesToDisplay = defaultPreviewPages(),
            pagerState = rememberPagerState(initialPage = 0) {
                pageCount
            },
            onMakeFirefoxDefaultClick = {},
            onMakeFirefoxDefaultSkipClick = {},
            onSignInButtonClick = {},
            onSignInSkipClick = {},
            onNotificationPermissionButtonClick = {},
            onNotificationPermissionSkipClick = {},
            onAddFirefoxWidgetClick = {},
            onSkipFirefoxWidgetClick = {},
            onAddOnsButtonClick = {},
            onInstallAddOnButtonClick = {},
            onCustomizeToolbarButtonClick = {},
            onCustomizeToolbarSkipClick = {},
            onCustomizeThemeButtonClick = {},
            onCustomizeThemeButtonSkip = {},
            onAgreeAndConfirmTermsOfService = {},
            termsOfServiceEventHandler = object : OnboardingTermsOfServiceEventHandler {},
        )
    }
}

@Composable
private fun defaultPreviewPages() = listOf(
    OnboardingPageUiData(
        type = OnboardingPageUiData.Type.DEFAULT_BROWSER,
        imageRes = R.drawable.ic_onboarding_welcome,
        title = stringResource(R.string.juno_onboarding_default_browser_title_nimbus_2),
        description = stringResource(R.string.juno_onboarding_default_browser_description_nimbus_3),
        primaryButtonLabel = stringResource(R.string.juno_onboarding_default_browser_positive_button),
        secondaryButtonLabel = stringResource(R.string.juno_onboarding_default_browser_negative_button),
        privacyCaption = Caption(
            text = stringResource(R.string.juno_onboarding_privacy_notice_text),
            linkTextState = LinkTextState(
                text = stringResource(R.string.juno_onboarding_privacy_notice_text),
                url = "",
                onClick = {},
            ),
        ),
    ),
    OnboardingPageUiData(
        type = OnboardingPageUiData.Type.SYNC_SIGN_IN,
        imageRes = R.drawable.ic_onboarding_sync,
        title = stringResource(R.string.juno_onboarding_sign_in_title_2),
        description = stringResource(R.string.juno_onboarding_sign_in_description_3),
        primaryButtonLabel = stringResource(R.string.juno_onboarding_sign_in_positive_button),
        secondaryButtonLabel = stringResource(R.string.juno_onboarding_sign_in_negative_button),
        privacyCaption = Caption(
            text = stringResource(R.string.juno_onboarding_privacy_notice_text),
            linkTextState = LinkTextState(
                text = stringResource(R.string.juno_onboarding_privacy_notice_text),
                url = "",
                onClick = {},
            ),
        ),
    ),
    OnboardingPageUiData(
        type = OnboardingPageUiData.Type.NOTIFICATION_PERMISSION,
        imageRes = R.drawable.ic_notification_permission,
        title = stringResource(R.string.juno_onboarding_enable_notifications_title_nimbus_2),
        description = stringResource(R.string.juno_onboarding_enable_notifications_description_nimbus_2),
        primaryButtonLabel = stringResource(R.string.juno_onboarding_enable_notifications_positive_button),
        secondaryButtonLabel = stringResource(R.string.juno_onboarding_enable_notifications_negative_button),
        privacyCaption = Caption(
            text = stringResource(R.string.juno_onboarding_privacy_notice_text),
            linkTextState = LinkTextState(
                text = stringResource(R.string.juno_onboarding_privacy_notice_text),
                url = "",
                onClick = {},
            ),
        ),
    ),
)
