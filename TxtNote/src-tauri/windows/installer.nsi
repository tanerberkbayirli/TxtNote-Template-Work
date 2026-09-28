Unicode true
ManifestDPIAware true
; Add in `dpiAwareness` `PerMonitorV2` to manifest for Windows 10 1607+ (note this should not affect lower versions since they should be able to ignore this and pick up `dpiAware` `true` set by `ManifestDPIAware true`)
; Currently undocumented on NSIS's website but is in the Docs folder of source tree, see
; https://github.com/kichik/nsis/blob/5fc0b87b819a9eec006df4967d08e522ddd651c9/Docs/src/attributes.but#L286-L300
; https://github.com/tauri-apps/tauri/pull/10106
ManifestDPIAwareness PerMonitorV2

!if "{{compression}}" == "none"
 SetCompress off
!else
 ; Set the compression algorithm. We default to LZMA.
 SetCompressor /SOLID "{{compression}}"
!endif

; Keep above !include to stay ahead of any plugin command
; see https://github.com/tauri-apps/tauri/pull/15422#discussion_r3289239624
{{#if signed_plugins_path}}
!addplugindir "{{signed_plugins_path}}"
{{/if}}

!include MUI2.nsh
!include FileFunc.nsh
!include x64.nsh
!include WordFunc.nsh
!include "utils.nsh"
!include "FileAssociation.nsh"
!include "Win\COM.nsh"
!include "Win\Propkey.nsh"
!include "StrFunc.nsh"
${StrCase}
${StrLoc}

{{#if installer_hooks}}
!include "{{installer_hooks}}"
{{/if}}

!define WEBVIEW2APPGUID "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"

!define MANUFACTURER "{{manufacturer}}"
!define PRODUCTNAME "{{product_name}}"
!define VERSION "{{version}}"
!define VERSIONWITHBUILD "{{version_with_build}}"
!define HOMEPAGE "{{homepage}}"
!define INSTALLMODE "{{install_mode}}"
!define LICENSE "{{license}}"
!define INSTALLERICON "{{installer_icon}}"
!define SIDEBARIMAGE "{{sidebar_image}}"
!define HEADERIMAGE "{{header_image}}"
!define UNINSTALLERICON "{{uninstaller_icon}}"
!define UNINSTALLERHEADERIMAGE "{{uninstaller_header_image}}"
!define MAINBINARYNAME "{{main_binary_name}}"
!define MAINBINARYSRCPATH "{{main_binary_path}}"
!define BUNDLEID "{{bundle_id}}"
!define COPYRIGHT "{{copyright}}"
!define OUTFILE "{{out_file}}"
!define ARCH "{{arch}}"
!define ADDITIONALPLUGINSPATH "{{additional_plugins_path}}"
!define ALLOWDOWNGRADES "{{allow_downgrades}}"
!define DISPLAYLANGUAGESELECTOR "{{display_language_selector}}"
!define INSTALLWEBVIEW2MODE "{{install_webview2_mode}}"
!define WEBVIEW2INSTALLERARGS "{{webview2_installer_args}}"
!define WEBVIEW2BOOTSTRAPPERPATH "{{webview2_bootstrapper_path}}"
!define WEBVIEW2INSTALLERPATH "{{webview2_installer_path}}"
!define MINIMUMWEBVIEW2VERSION "{{minimum_webview2_version}}"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCTNAME}"
!define MANUKEY "Software\${MANUFACTURER}"
!define MANUPRODUCTKEY "${MANUKEY}\${PRODUCTNAME}"
!define UNINSTALLERSIGNCOMMAND "{{uninstaller_sign_cmd}}"
!define ESTIMATEDSIZE "{{estimated_size}}"
!define STARTMENUFOLDER "{{start_menu_folder}}"

Var PassiveMode
Var UpdateMode
Var NoShortcutMode
Var WixMode
Var OldMainBinaryName
Var DesktopShortcut
Var TxtNoteDialog
Var TxtNoteDirRequest
Var TxtNoteBrowseBtn
Var TxtNoteCheckbox
Var TxtNoteFinishBtn
Var TxtNoteTitleFont
Var TxtNoteBodyFont
Var TxtNoteBtnFont
Var TxtNoteCaptionFont
Var TxtNoteLogo
Var TxtNoteLogoImage
Var DarkChromeBottom
Var TxtNoteChromeReady

; COLORREF is 0x00BBGGRR. Comments show the sRGB hex.
!define TXTNOTE_BG 0x1A1412          ; #12141A canvas
!define TXTNOTE_SURFACE 0x24201C    ; #1C2024 raised panel
!define TXTNOTE_FIELD 0x2C2622      ; #22262C inputs
!define TXTNOTE_BTN 0x362C28        ; #282C36 secondary
!define TXTNOTE_LINE 0x3A322C       ; #2C323A hairline
!define TXTNOTE_FG 0xF6F4F2         ; #F2F4F6 primary text
!define TXTNOTE_MUTED 0xA3968E      ; #8E96A3 secondary text
!define TXTNOTE_CTA_BG 0xDFE8ED     ; #EDE8DF warm paper CTA
!define TXTNOTE_CTA_FG 0x1A1412     ; #12141A on CTA
!define TXTNOTE_WIN_W 560
!define TXTNOTE_WIN_H 508
!define TXTNOTE_FOOTER 76
!define TXTNOTE_BTN_W 128
!define TXTNOTE_BTN_H 34
!define /ifndef SS_CENTER 0x00000001
!define /ifndef SS_CENTERIMAGE 0x00000200
!define /ifndef SS_NOTIFY 0x00000100
!define /ifndef STM_SETICON 0x0170
!define /ifndef PBM_SETBARCOLOR 0x0409
!define /ifndef PBM_SETBKCOLOR 0x2001
!define /ifndef WS_BORDER 0x00800000
; Unique string baked into the EXE so we can verify this template was compiled.
!define TXTNOTE_INSTALLER_BUILD "TXTNOTE_INSTALLER_BUILD 20260906f"

Name "${PRODUCTNAME}"
BrandingText " "
OutFile "${OUTFILE}"
ShowInstDetails nevershow
ShowUninstDetails nevershow
AutoCloseWindow true
InstallColors F2F4F6 12141A

; We don't actually use this value as default install path,
; it's just for nsis to append the product name folder in the directory selector
; https://nsis.sourceforge.io/Reference/InstallDir
!define PLACEHOLDER_INSTALL_DIR "placeholder\${PRODUCTNAME}"
InstallDir "${PLACEHOLDER_INSTALL_DIR}"

VIProductVersion "${VERSIONWITHBUILD}"
VIAddVersionKey "ProductName" "${PRODUCTNAME}"
VIAddVersionKey "FileDescription" "${PRODUCTNAME}"
VIAddVersionKey "LegalCopyright" "${COPYRIGHT}"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"

# additional plugins
!addplugindir "${ADDITIONALPLUGINSPATH}"

; Uninstaller signing command
!if "${UNINSTALLERSIGNCOMMAND}" != ""
 !uninstfinalize '${UNINSTALLERSIGNCOMMAND}'
!endif

; Handle install mode, `perUser`, `perMachine` or `both`
!if "${INSTALLMODE}" == "perMachine"
 RequestExecutionLevel admin
!endif

!if "${INSTALLMODE}" == "currentUser"
 RequestExecutionLevel user
!endif

!if "${INSTALLMODE}" == "both"
 !define MULTIUSER_MUI
 !define MULTIUSER_INSTALLMODE_INSTDIR "${PRODUCTNAME}"
 !define MULTIUSER_INSTALLMODE_COMMANDLINE
 !if "${ARCH}" == "x64"
 !define MULTIUSER_USE_PROGRAMFILES64
 !else if "${ARCH}" == "arm64"
 !define MULTIUSER_USE_PROGRAMFILES64
 !endif
 !define MULTIUSER_INSTALLMODE_DEFAULT_REGISTRY_KEY "${UNINSTKEY}"
 !define MULTIUSER_INSTALLMODE_DEFAULT_REGISTRY_VALUENAME "CurrentUser"
 !define MULTIUSER_INSTALLMODEPAGE_SHOWUSERNAME
 !define MULTIUSER_INSTALLMODE_FUNCTION RestorePreviousInstallLocation
 !define MULTIUSER_EXECUTIONLEVEL Highest
 !include MultiUser.nsh
!endif

; Installer icon
!if "${INSTALLERICON}" != ""
 !define MUI_ICON "${INSTALLERICON}"
!endif

; Installer sidebar image
!if "${SIDEBARIMAGE}" != ""
 !define MUI_WELCOMEFINISHPAGE_BITMAP "${SIDEBARIMAGE}"
!endif

; HEADERIMAGE is used as the setup-page wordmark only. Do not enable
; MUI_HEADERIMAGE — the banner and separator lines break the layout.

; Uninstaller icon
!if "${UNINSTALLERICON}" != ""
 !define MUI_UNICON "${UNINSTALLERICON}"
!endif

; Define registry key to store installer language
!define MUI_LANGDLL_REGISTRY_ROOT "HKCU"
!define MUI_LANGDLL_REGISTRY_KEY "${MANUPRODUCTKEY}"
!define MUI_LANGDLL_REGISTRY_VALUENAME "Installer Language"

!define MUI_BGCOLOR 12141A
!define MUI_TEXTCOLOR F2F4F6
!define MUI_INSTFILESPAGE_COLORS "F2F4F6 12141A"
!define MUI_CUSTOMFUNCTION_GUIINIT TxtNoteOnGUIInit
!define MUI_CUSTOMFUNCTION_UNGUIINIT un.TxtNoteOnGUIInit

; Installer pages, must be ordered as they appear
; Initialize MUI UI (this page is always skipped)
!define MUI_PAGE_CUSTOMFUNCTION_PRE Skip
!insertmacro MUI_PAGE_WELCOME

; 2. License Page (if defined)
!if "${LICENSE}" != ""
 !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
 !insertmacro MUI_PAGE_LICENSE "${LICENSE}"
!endif

; 3. Install mode (if it is set to `both`)
!if "${INSTALLMODE}" == "both"
 !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
 !insertmacro MULTIUSER_PAGE_INSTALLMODE
!endif

; 4. Show a concise maintenance page only when a previous installation exists.
; Updating overwrites the app files in place and preserves the user's notes.
Var MaintenanceMode
Page custom PageReinstall PageLeaveReinstall
Function PageReinstall
 ; Uninstall previous WiX installation if exists.
 ;
 ; A WiX installer stores the installation info in registry
 ; using a UUID and so we have to loop through all keys under
 ; `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`
 ; and check if `DisplayName` and `Publisher` keys match ${PRODUCTNAME} and ${MANUFACTURER}
 ;
 ; This has a potential issue that there maybe another installation that matches
 ; our ${PRODUCTNAME} and ${MANUFACTURER} but wasn't installed by our WiX installer,
 ; however, this should be fine since the user will have to confirm the uninstallation
 ; and they can chose to abort it if doesn't make sense.
 StrCpy $0 0
 wix_loop:
 EnumRegKey $1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" $0
 StrCmp $1 "" wix_loop_done ; Exit loop if there is no more keys to loop on
 IntOp $0 $0 + 1
 ReadRegStr $R0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$1" "DisplayName"
 ReadRegStr $R1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$1" "Publisher"
 StrCmp "$R0$R1" "${PRODUCTNAME}${MANUFACTURER}" 0 wix_loop
 ReadRegStr $R0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$1" "UninstallString"
 ${StrCase} $R1 $R0 "L"
 ${StrLoc} $R0 $R1 "msiexec" ">"
 StrCmp $R0 0 0 wix_loop_done
 StrCpy $WixMode 1
 StrCpy $R6 "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$1"
 Goto compare_version
 wix_loop_done:

 ; Check if there is an existing installation, if not, abort the reinstall page
 ReadRegStr $R0 SHCTX "${UNINSTKEY}" ""
 ReadRegStr $R1 SHCTX "${UNINSTKEY}" "UninstallString"
 ${IfThen} "$R0$R1" == "" ${|} Abort ${|}

 ; Compare this installer version with the existing installation and present one
 ; clear action. Removing the app is intentionally kept in uninstall.exe rather
 ; than offered as a second, unrelated choice during an update.
 compare_version:
 ${If} $WixMode = 1
 ReadRegStr $R0 HKLM "$R6" "DisplayVersion"
 ${Else}
 ReadRegStr $R0 SHCTX "${UNINSTKEY}" "DisplayVersion"
 ${EndIf}

 nsis_tauri_utils::SemverCompare "${VERSION}" $R0
 Pop $R0
 StrCpy $MaintenanceMode 1
 ; Reinstalling the same version
 ${If} $R0 = 0
 StrCpy $R1 "Bu TxtNote s${U+00FC}r${U+00FC}m${U+00FC} zaten y${U+00FC}kl${U+00FC}. Uygulama dosyalar${U+0131} yenilenecek; notlar${U+0131}n${U+0131}z korunur."
 StrCpy $R2 "Yeniden y${U+00FC}kle"
 ; Upgrading
 ${ElseIf} $R0 = 1
 StrCpy $R1 "Yeni TxtNote s${U+00FC}r${U+00FC}m${U+00FC} kurulmaya haz${U+0131}r. Notlar${U+0131}n${U+0131}z ve ayarlar${U+0131}n${U+0131}z korunur."
 StrCpy $R2 "G${U+00FC}ncelle"
 ; Downgrading
 ${ElseIf} $R0 = -1
 !if "${ALLOWDOWNGRADES}" == "true"
 StrCpy $R1 "Bu kurulum cihaz${U+0131}n${U+0131}zdaki TxtNote s${U+00FC}r${U+00FC}m${U+00FC}nden daha eski. Devam ederseniz uygulama geri al${U+0131}n${U+0131}r; notlar${U+0131}n${U+0131}z korunur."
 StrCpy $R2 "Eski s${U+00FC}r${U+00FC}m${U+00FC} y${U+00FC}kle"
 !else
 StrCpy $R1 "Cihaz${U+0131}n${U+0131}zda daha yeni bir TxtNote s${U+00FC}r${U+00FC}m${U+00FC} y${U+00FC}kl${U+00FC}. Bu eski kurulumla devam edilemez."
 StrCpy $R2 "Devam edilemez"
 !endif
 ${Else}
 Abort
 ${EndIf}

 ; Skip showing the page if passive
 ;
 ; Note that we don't call this earlier at the begining
 ; of this function because we need to populate some variables
 ; related to current installed version if detected and whether
 ; we are downgrading or not.
 ${If} $PassiveMode = 1
 Call PageLeaveReinstall
 ${Else}
  nsDialogs::Create 1018
  Pop $R4
  ${IfThen} $(^RTL) = 1 ${|} nsDialogs::SetRTL $(^RTL) ${|}
   Call ApplyDarkChrome
   SetCtlColors $R4 ${TXTNOTE_FG} ${TXTNOTE_BG}
   Push $R2
   Push "${U+0130}ptal"
   Call ShowWizardButtons

   ${NSD_CreateIcon} 20u 14u 16u 16u "$PLUGINSDIR\setup.ico"
   Pop $0

   ${NSD_CreateLabel} 50u 16u 230u 12u "TxtNote"
   Pop $0
   SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
   SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

   ${NSD_CreateLabel} 20u 38u 280u 18u $R2
   Pop $0
   SendMessage $0 ${WM_SETFONT} $TxtNoteTitleFont 1
   SetCtlColors $0 ${TXTNOTE_FG} ${TXTNOTE_BG}

   ${NSD_CreateLabel} 20u 62u 280u 36u $R1
   Pop $R1
   SendMessage $R1 ${WM_SETFONT} $TxtNoteBodyFont 1
   SetCtlColors $R1 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

   ${NSD_CreateLabel} 20u 108u 280u 24u "Kald${U+0131}rmak i${U+00E7}in Windows'taki Uygulamalar listesinde TxtNote'u se${U+00E7}in."
   Pop $0
   SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
   SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

 !if "${ALLOWDOWNGRADES}" == "false"
   ${If} $R0 = -1
     GetDlgItem $0 $HWNDPARENT 1
     EnableWindow $0 0
   ${EndIf}
 !endif
   nsDialogs::Show
 ${EndIf}
FunctionEnd
Function PageLeaveReinstall
 ; If migrating from Wix, always uninstall
 ${If} $WixMode = 1
 Goto reinst_uninstall
 ${EndIf}

 !if "${ALLOWDOWNGRADES}" == "false"
 ${If} $R0 = -1
   MessageBox MB_OK|MB_ICONEXCLAMATION "Cihaz${U+0131}n${U+0131}zda daha yeni bir TxtNote s${U+00FC}r${U+00FC}m${U+00FC} y${U+00FC}kl${U+00FC}."
   Abort
 ${EndIf}
 !endif

 ; NSIS updates the files in the existing location without touching app data.
 Goto reinst_done

 reinst_uninstall:
 HideWindow
 ClearErrors

 ${If} $WixMode = 1
 ReadRegStr $R1 HKLM "$R6" "UninstallString"
 ExecWait '$R1' $0
 ${Else}
 ReadRegStr $4 SHCTX "${MANUPRODUCTKEY}" ""
 ReadRegStr $R1 SHCTX "${UNINSTKEY}" "UninstallString"
 ${IfThen} $UpdateMode = 1 ${|} StrCpy $R1 "$R1 /UPDATE" ${|} ; append /UPDATE
 ${IfThen} $PassiveMode = 1 ${|} StrCpy $R1 "$R1 /P" ${|} ; append /P
 StrCpy $R1 "$R1 _?=$4" ; append uninstall directory
 ExecWait '$R1' $0
 ${EndIf}

 BringToFront

 ${IfThen} ${Errors} ${|} StrCpy $0 2 ${|} ; ExecWait failed, set fake exit code

 ${If} $0 <> 0
 ${OrIf} ${FileExists} "$INSTDIR\${MAINBINARYNAME}.exe"
 ; User cancelled wix uninstaller? return to select un/reinstall page
 ${If} $WixMode = 1
 ${AndIf} $0 = 1602
 Abort
 ${EndIf}

 ; User cancelled NSIS uninstaller? return to select un/reinstall page
 ${If} $0 = 1
 Abort
 ${EndIf}

 ; Other erros? show generic error message and return to select un/reinstall page
 MessageBox MB_ICONEXCLAMATION "$(unableToUninstall)"
 Abort
 ${EndIf}
 reinst_done:
FunctionEnd

; 5. TxtNote setup page. Location and shortcut preferences are kept together so
; a new installation can be completed from a single screen.
Page custom PageSetup PageSetupLeave

; 6. Start menu shortcut page
Var AppStartMenuFolder
!if "${STARTMENUFOLDER}" != ""
 !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
 !define MUI_STARTMENUPAGE_DEFAULTFOLDER "${STARTMENUFOLDER}"
!else
 !define MUI_PAGE_CUSTOMFUNCTION_PRE Skip
!endif
!insertmacro MUI_PAGE_STARTMENU Application $AppStartMenuFolder

; 6. Installation page
!define MUI_PAGE_CUSTOMFUNCTION_SHOW InstFilesShow
!insertmacro MUI_PAGE_INSTFILES

Function RunMainBinary
 nsis_tauri_utils::RunAsUser "$INSTDIR\${MAINBINARYNAME}.exe" ""
FunctionEnd

; Uninstaller Pages
Var DeleteAppDataCheckbox
Var DeleteAppDataCheckboxState
Var TxtNoteUnCancelBtn
Var TxtNoteUnActionBtn

UninstPage custom un.PageConfirm un.PageConfirmLeave
!define MUI_PAGE_CUSTOMFUNCTION_SHOW un.InstFilesShow
!insertmacro MUI_UNPAGE_INSTFILES

;Languages
{{#each languages}}
!insertmacro MUI_LANGUAGE "{{this}}"
{{/each}}
!insertmacro MUI_RESERVEFILE_LANGDLL
{{#each language_files}}
 !include "{{this}}"
{{/each}}

Function .onInit
 StrCpy $DesktopShortcut ${BST_CHECKED}
 StrCpy $DarkChromeBottom ${TXTNOTE_FOOTER}
 StrCpy $TxtNoteChromeReady 0
 InitPluginsDir
 File /oname=$PLUGINSDIR\setup.ico "${INSTALLERICON}"

 ${GetOptions} $CMDLINE "/P" $PassiveMode
 ${IfNot} ${Errors}
 StrCpy $PassiveMode 1
 ${EndIf}

 ${GetOptions} $CMDLINE "/NS" $NoShortcutMode
 ${IfNot} ${Errors}
 StrCpy $NoShortcutMode 1
 ${EndIf}

 ${GetOptions} $CMDLINE "/UPDATE" $UpdateMode
 ${IfNot} ${Errors}
 StrCpy $UpdateMode 1
 ${EndIf}

 !if "${DISPLAYLANGUAGESELECTOR}" == "true"
 !insertmacro MUI_LANGDLL_DISPLAY
 !endif

 !insertmacro SetContext

 ${If} $INSTDIR == "${PLACEHOLDER_INSTALL_DIR}"
 ; Set default install location
 !if "${INSTALLMODE}" == "perMachine"
 ${If} ${RunningX64}
 !if "${ARCH}" == "x64"
 StrCpy $INSTDIR "$PROGRAMFILES64\${PRODUCTNAME}"
 !else if "${ARCH}" == "arm64"
 StrCpy $INSTDIR "$PROGRAMFILES64\${PRODUCTNAME}"
 !else
 StrCpy $INSTDIR "$PROGRAMFILES\${PRODUCTNAME}"
 !endif
 ${Else}
 StrCpy $INSTDIR "$PROGRAMFILES\${PRODUCTNAME}"
 ${EndIf}
 !else if "${INSTALLMODE}" == "currentUser"
 StrCpy $INSTDIR "$LOCALAPPDATA\${PRODUCTNAME}"
 !endif

 Call RestorePreviousInstallLocation
 ${EndIf}

 !if "${INSTALLMODE}" == "both"
 !insertmacro MULTIUSER_INIT
 !endif
FunctionEnd

Section EarlyChecks
 ; Abort silent installer if downgrades is disabled
 !if "${ALLOWDOWNGRADES}" == "false"
 ${If} ${Silent}
 ; If downgrading
 ${If} $R0 = -1
 System::Call 'kernel32::AttachConsole(i -1)i.r0'
 ${If} $0 <> 0
 System::Call 'kernel32::GetStdHandle(i -11)i.r0'
 System::call 'kernel32::SetConsoleTextAttribute(i r0, i 0x0004)' ; set red color
 FileWrite $0 "$(silentDowngrades)"
 ${EndIf}
 Abort
 ${EndIf}
 ${EndIf}
 !endif

SectionEnd

Section WebView2
 ; Check if Webview2 is already installed and skip this section
 ${If} ${RunningX64}
 ReadRegStr $4 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\${WEBVIEW2APPGUID}" "pv"
 ${Else}
 ReadRegStr $4 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\${WEBVIEW2APPGUID}" "pv"
 ${EndIf}
 ${If} $4 == ""
 ReadRegStr $4 HKCU "SOFTWARE\Microsoft\EdgeUpdate\Clients\${WEBVIEW2APPGUID}" "pv"
 ${EndIf}

 ${If} $4 == ""
 ; Webview2 installation
 ;
 ; Skip if updating
 ${If} $UpdateMode <> 1
 !if "${INSTALLWEBVIEW2MODE}" == "downloadBootstrapper"
 Delete "$TEMP\MicrosoftEdgeWebview2Setup.exe"
 DetailPrint "$(webview2Downloading)"
 NSISdl::download "https://go.microsoft.com/fwlink/p/?LinkId=2124703" "$TEMP\MicrosoftEdgeWebview2Setup.exe"
 Pop $0
 ${If} $0 == "success"
 DetailPrint "$(webview2DownloadSuccess)"
 ${Else}
 DetailPrint "$(webview2DownloadError)"
 Abort "$(webview2AbortError)"
 ${EndIf}
 StrCpy $6 "$TEMP\MicrosoftEdgeWebview2Setup.exe"
 Goto install_webview2
 !endif

 !if "${INSTALLWEBVIEW2MODE}" == "embedBootstrapper"
 Delete "$TEMP\MicrosoftEdgeWebview2Setup.exe"
 File "/oname=$TEMP\MicrosoftEdgeWebview2Setup.exe" "${WEBVIEW2BOOTSTRAPPERPATH}"
 DetailPrint "$(installingWebview2)"
 StrCpy $6 "$TEMP\MicrosoftEdgeWebview2Setup.exe"
 Goto install_webview2
 !endif

 !if "${INSTALLWEBVIEW2MODE}" == "offlineInstaller"
 Delete "$TEMP\MicrosoftEdgeWebView2RuntimeInstaller.exe"
 File "/oname=$TEMP\MicrosoftEdgeWebView2RuntimeInstaller.exe" "${WEBVIEW2INSTALLERPATH}"
 DetailPrint "$(installingWebview2)"
 StrCpy $6 "$TEMP\MicrosoftEdgeWebView2RuntimeInstaller.exe"
 Goto install_webview2
 !endif

 Goto webview2_done

 install_webview2:
 DetailPrint "$(installingWebview2)"
 ; $6 holds the path to the webview2 installer
 ExecWait "$6 ${WEBVIEW2INSTALLERARGS} /install" $1
 ${If} $1 = 0
 DetailPrint "$(webview2InstallSuccess)"
 ${Else}
 DetailPrint "$(webview2InstallError)"
 Abort "$(webview2AbortError)"
 ${EndIf}
 webview2_done:
 ${EndIf}
 ${Else}
 !if "${MINIMUMWEBVIEW2VERSION}" != ""
 ${VersionCompare} "${MINIMUMWEBVIEW2VERSION}" "$4" $R0
 ${If} $R0 = 1
 update_webview:
 DetailPrint "$(installingWebview2)"
 ${If} ${RunningX64}
 ReadRegStr $R1 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate" "path"
 ${Else}
 ReadRegStr $R1 HKLM "SOFTWARE\Microsoft\EdgeUpdate" "path"
 ${EndIf}
 ${If} $R1 == ""
 ReadRegStr $R1 HKCU "SOFTWARE\Microsoft\EdgeUpdate" "path"
 ${EndIf}
 ${If} $R1 != ""
 ; Chromium updater docs: https://source.chromium.org/chromium/chromium/src/+/main:docs/updater/user_manual.md
 ; Modified from "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Microsoft EdgeWebView\ModifyPath"
 ExecWait `"$R1" /install appguid=${WEBVIEW2APPGUID}&needsadmin=true` $1
 ${If} $1 = 0
 DetailPrint "$(webview2InstallSuccess)"
 ${Else}
 MessageBox MB_ICONEXCLAMATION|MB_ABORTRETRYIGNORE "$(webview2InstallError)" IDIGNORE ignore IDRETRY update_webview
 Quit
 ignore:
 ${EndIf}
 ${EndIf}
 ${EndIf}
 !endif
 ${EndIf}
SectionEnd

Section Install
 SetOutPath $INSTDIR

 !ifmacrodef NSIS_HOOK_PREINSTALL
 !insertmacro NSIS_HOOK_PREINSTALL
 !endif

 !insertmacro CheckIfAppIsRunning "${MAINBINARYNAME}.exe" "${PRODUCTNAME}"

 ; Copy main executable
 File "${MAINBINARYSRCPATH}"

 ; Copy branded shortcut icon so Explorer does not reuse a cached exe thumbnail
 File "/oname=$INSTDIR\txtnote.ico" "${INSTALLERICON}"

 ; Copy resources
 {{#each resources_dirs}}
 CreateDirectory "$INSTDIR\\{{this}}"
 {{/each}}
 {{#each resources}}
 File /a "/oname={{this.[1]}}" "{{no-escape @key}}"
 {{/each}}

 ; Copy external binaries
 {{#each binaries}}
 File /a "/oname={{this}}" "{{no-escape @key}}"
 {{/each}}

 ; Create file associations
 {{#each file_associations as |association| ~}}
 {{#each association.ext as |ext| ~}}
 !insertmacro APP_ASSOCIATE "{{ext}}" "{{or association.name ext}}" "{{association-description association.description ext}}" "$INSTDIR\${MAINBINARYNAME}.exe,0" "Open with ${PRODUCTNAME}" "$INSTDIR\${MAINBINARYNAME}.exe $\"%1$\""
 {{/each}}
 {{/each}}

 ; Register deep links
 {{#each deep_link_protocols as |protocol| ~}}
 WriteRegStr SHCTX "Software\Classes\\{{protocol}}" "URL Protocol" ""
 WriteRegStr SHCTX "Software\Classes\\{{protocol}}" "" "URL:${BUNDLEID} protocol"
 WriteRegStr SHCTX "Software\Classes\\{{protocol}}\DefaultIcon" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\",0"
 WriteRegStr SHCTX "Software\Classes\\{{protocol}}\shell\open\command" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""
 {{/each}}

 ; Create uninstaller
 WriteUninstaller "$INSTDIR\uninstall.exe"

 ; Save $INSTDIR in registry for future installations
 WriteRegStr SHCTX "${MANUPRODUCTKEY}" "" $INSTDIR

 !if "${INSTALLMODE}" == "both"
 ; Save install mode to be selected by default for the next installation such as updating
 ; or when uninstalling
 WriteRegStr SHCTX "${UNINSTKEY}" $MultiUser.InstallMode 1
 !endif

 ; Remove old main binary if it doesn't match new main binary name
 ReadRegStr $OldMainBinaryName SHCTX "${UNINSTKEY}" "MainBinaryName"
 ${If} $OldMainBinaryName != ""
 ${AndIf} $OldMainBinaryName != "${MAINBINARYNAME}.exe"
 Delete "$INSTDIR\$OldMainBinaryName"
 ${EndIf}

 ; Save current MAINBINARYNAME for future updates
 WriteRegStr SHCTX "${UNINSTKEY}" "MainBinaryName" "${MAINBINARYNAME}.exe"

 ; Registry information for add/remove programs
 WriteRegStr SHCTX "${UNINSTKEY}" "DisplayName" "${PRODUCTNAME}"
 WriteRegStr SHCTX "${UNINSTKEY}" "DisplayIcon" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\""
 WriteRegStr SHCTX "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
 WriteRegStr SHCTX "${UNINSTKEY}" "Publisher" "${MANUFACTURER}"
 WriteRegStr SHCTX "${UNINSTKEY}" "InstallLocation" "$\"$INSTDIR$\""
 WriteRegStr SHCTX "${UNINSTKEY}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
 WriteRegDWORD SHCTX "${UNINSTKEY}" "NoModify" "1"
 WriteRegDWORD SHCTX "${UNINSTKEY}" "NoRepair" "1"

 ${GetSize} "$INSTDIR" "/M=uninstall.exe /S=0K /G=0" $0 $1 $2
 IntOp $0 $0 + ${ESTIMATEDSIZE}
 IntFmt $0 "0x%08X" $0
 WriteRegDWORD SHCTX "${UNINSTKEY}" "EstimatedSize" "$0"

 !if "${HOMEPAGE}" != ""
 WriteRegStr SHCTX "${UNINSTKEY}" "URLInfoAbout" "${HOMEPAGE}"
 WriteRegStr SHCTX "${UNINSTKEY}" "URLUpdateInfo" "${HOMEPAGE}"
 WriteRegStr SHCTX "${UNINSTKEY}" "HelpLink" "${HOMEPAGE}"
 !endif

 ; Create start menu shortcut
 !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
 Call CreateOrUpdateStartMenuShortcut
 !insertmacro MUI_STARTMENU_WRITE_END

 ; Create desktop shortcut when the user asked for it (GUI),
 ; or for silent/passive installers (finish page is skipped)
 ${If} $PassiveMode = 1
 ${OrIf} ${Silent}
   Call CreateOrUpdateDesktopShortcut
 ${ElseIf} $DesktopShortcut = ${BST_CHECKED}
   Call CreateOrUpdateDesktopShortcut
 ${EndIf}

 !ifmacrodef NSIS_HOOK_POSTINSTALL
   !insertmacro NSIS_HOOK_POSTINSTALL
 !endif

 SetAutoClose true
SectionEnd

Function .onInstSuccess
 ${If} $PassiveMode = 1
 ${OrIf} ${Silent}
   ${GetOptions} $CMDLINE "/R" $R0
   ${IfNot} ${Errors}
     ${GetOptions} $CMDLINE "/ARGS" $R0
     nsis_tauri_utils::RunAsUser "$INSTDIR\${MAINBINARYNAME}.exe" "$R0"
   ${EndIf}
 ${Else}
   Call RunMainBinary
 ${EndIf}
FunctionEnd

Function un.onInit
 !insertmacro SetContext
 StrCpy $DarkChromeBottom ${TXTNOTE_FOOTER}
 StrCpy $TxtNoteChromeReady 0
 StrCpy $DeleteAppDataCheckboxState 0
 InitPluginsDir
 File /oname=$PLUGINSDIR\setup.ico "${INSTALLERICON}"

 !if "${INSTALLMODE}" == "both"
 !insertmacro MULTIUSER_UNINIT
 !endif

 !insertmacro MUI_UNGETLANGUAGE

 ${GetOptions} $CMDLINE "/P" $PassiveMode
 ${IfNot} ${Errors}
 StrCpy $PassiveMode 1
 ${EndIf}

 ${GetOptions} $CMDLINE "/UPDATE" $UpdateMode
 ${IfNot} ${Errors}
 StrCpy $UpdateMode 1
 ${EndIf}
FunctionEnd

Section Uninstall

 !ifmacrodef NSIS_HOOK_PREUNINSTALL
 !insertmacro NSIS_HOOK_PREUNINSTALL
 !endif

 !insertmacro CheckIfAppIsRunning "${MAINBINARYNAME}.exe" "${PRODUCTNAME}"

 ; Delete the app directory and its content from disk
 ; Copy main executable
 Delete "$INSTDIR\${MAINBINARYNAME}.exe"
 Delete "$INSTDIR\txtnote.ico"

 ; Delete resources
 {{#each resources}}
 Delete "$INSTDIR\\{{this.[1]}}"
 {{/each}}

 ; Delete external binaries
 {{#each binaries}}
 Delete "$INSTDIR\\{{this}}"
 {{/each}}

 ; Delete app associations
 {{#each file_associations as |association| ~}}
 {{#each association.ext as |ext| ~}}
 !insertmacro APP_UNASSOCIATE "{{ext}}" "{{or association.name ext}}"
 {{/each}}
 {{/each}}

 ; Delete deep links
 {{#each deep_link_protocols as |protocol| ~}}
 ReadRegStr $R7 SHCTX "Software\Classes\\{{protocol}}\shell\open\command" ""
 ${If} $R7 == "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""
 DeleteRegKey SHCTX "Software\Classes\\{{protocol}}"
 ${EndIf}
 {{/each}}

 ; Delete uninstaller
 Delete "$INSTDIR\uninstall.exe"

 {{#each resources_ancestors}}
 RMDir /REBOOTOK "$INSTDIR\\{{this}}"
 {{/each}}
 RMDir "$INSTDIR"

 ; Remove shortcuts if not updating
 ${If} $UpdateMode <> 1
 !insertmacro DeleteAppUserModelId

 ; Remove start menu shortcut
 !insertmacro MUI_STARTMENU_GETFOLDER Application $AppStartMenuFolder
 !insertmacro IsShortcutTarget "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
 Pop $0
 ${If} $0 = 1
 !insertmacro UnpinShortcut "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk"
 Delete "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk"
 RMDir "$SMPROGRAMS\$AppStartMenuFolder"
 ${EndIf}
 !insertmacro IsShortcutTarget "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
 Pop $0
 ${If} $0 = 1
 !insertmacro UnpinShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk"
 Delete "$SMPROGRAMS\${PRODUCTNAME}.lnk"
 ${EndIf}

 ; Remove desktop shortcuts
 !insertmacro IsShortcutTarget "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
 Pop $0
 ${If} $0 = 1
 !insertmacro UnpinShortcut "$DESKTOP\${PRODUCTNAME}.lnk"
 Delete "$DESKTOP\${PRODUCTNAME}.lnk"
 ${EndIf}
 ${EndIf}

 ; Remove registry information for add/remove programs
 !if "${INSTALLMODE}" == "both"
 DeleteRegKey SHCTX "${UNINSTKEY}"
 !else if "${INSTALLMODE}" == "perMachine"
 DeleteRegKey HKLM "${UNINSTKEY}"
 !else
 DeleteRegKey HKCU "${UNINSTKEY}"
 !endif

 ; Removes the Autostart entry for ${PRODUCTNAME} from the HKCU Run key if it exists.
 ; This ensures the program does not launch automatically after uninstallation if it exists.
 ; If it doesn't exist, it does nothing.
 ; We do this when not updating (to preserve the registry value on updates)
 ${If} $UpdateMode <> 1
 DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}"
 ${EndIf}

 ; Delete app data if the checkbox is selected
 ; and if not updating
 ${If} $DeleteAppDataCheckboxState = 1
 ${AndIf} $UpdateMode <> 1
 ; Clear the install location $INSTDIR from registry
 DeleteRegKey SHCTX "${MANUPRODUCTKEY}"
 DeleteRegKey /ifempty SHCTX "${MANUKEY}"

 ; Clear the install language from registry
 DeleteRegValue HKCU "${MANUPRODUCTKEY}" "Installer Language"
 DeleteRegKey /ifempty HKCU "${MANUPRODUCTKEY}"
 DeleteRegKey /ifempty HKCU "${MANUKEY}"

 SetShellVarContext current
 RmDir /r "$APPDATA\${BUNDLEID}"
 RmDir /r "$LOCALAPPDATA\${BUNDLEID}"
 ${EndIf}

 !ifmacrodef NSIS_HOOK_POSTUNINSTALL
 !insertmacro NSIS_HOOK_POSTUNINSTALL
 !endif

 SetAutoClose true
SectionEnd

Function RestorePreviousInstallLocation
 ReadRegStr $4 SHCTX "${MANUPRODUCTKEY}" ""
 StrCmp $4 "" +2 0
 StrCpy $INSTDIR $4
FunctionEnd

Function Skip
 Abort
FunctionEnd

Function SkipIfPassive
 ${IfThen} $PassiveMode = 1 ${|} Abort ${|}
FunctionEnd
Function un.SkipIfPassive
 ${IfThen} $PassiveMode = 1 ${|} Abort ${|}
FunctionEnd

!macro TxtNoteHideStockChrome
  GetDlgItem $0 $HWNDPARENT 1037
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1038
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1034
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1039
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1046
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1256
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1028
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1035
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1036
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1044
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1045
  ShowWindow $0 ${SW_HIDE}
!macroend

!macro TxtNotePaintButton HWND FG BG
  System::Call 'uxtheme::SetWindowTheme(p ${HWND}, w " ", w " ")'
  SetCtlColors ${HWND} ${FG} ${BG}
  SendMessage ${HWND} ${WM_SETFONT} $TxtNoteBtnFont 1
!macroend

!macro TxtNoteApplyDarkChrome
  SetCtlColors $HWNDPARENT ${TXTNOTE_FG} ${TXTNOTE_BG}
  !insertmacro TxtNoteHideStockChrome

  ${If} $TxtNoteChromeReady != 1
    System::Call "user32::GetSystemMetrics(i 0) i .r7"
    System::Call "user32::GetSystemMetrics(i 1) i .r8"
    IntOp $7 $7 - ${TXTNOTE_WIN_W}
    IntOp $7 $7 / 2
    IntOp $8 $8 - ${TXTNOTE_WIN_H}
    IntOp $8 $8 / 2
    System::Call "user32::SetWindowPos(p $HWNDPARENT, i 0, i r7, i r8, i ${TXTNOTE_WIN_W}, i ${TXTNOTE_WIN_H}, i 0x04)"
    StrCpy $TxtNoteChromeReady 1
  ${EndIf}

  System::Alloc 16
  Pop $1
  System::Call "user32::GetClientRect(p $HWNDPARENT, p $1)"
  System::Call "*$1(i, i, i .r3, i .r4)"
  System::Free $1

  IntOp $6 $4 - ${TXTNOTE_FOOTER}
  FindWindow $0 "#32770" "" $HWNDPARENT
  ${If} $0 != 0
    SetCtlColors $0 ${TXTNOTE_FG} ${TXTNOTE_BG}
    System::Call "user32::SetWindowPos(p $0, i 0, i 0, i 0, i r3, i r6, i 0x14)"
  ${EndIf}

  IntOp $5 $3 - 20
  IntOp $5 $5 - ${TXTNOTE_BTN_W}
  IntOp $7 $4 - 21
  IntOp $7 $7 - ${TXTNOTE_BTN_H}
  GetDlgItem $0 $HWNDPARENT 1
  System::Call "user32::SetWindowPos(p $0, i 0, i r5, i r7, i ${TXTNOTE_BTN_W}, i ${TXTNOTE_BTN_H}, i 0x40)"
  !insertmacro TxtNotePaintButton $0 ${TXTNOTE_CTA_FG} ${TXTNOTE_CTA_BG}

  IntOp $5 $5 - 10
  IntOp $5 $5 - ${TXTNOTE_BTN_W}
  GetDlgItem $0 $HWNDPARENT 2
  System::Call "user32::SetWindowPos(p $0, i 0, i r5, i r7, i ${TXTNOTE_BTN_W}, i ${TXTNOTE_BTN_H}, i 0x40)"
  !insertmacro TxtNotePaintButton $0 ${TXTNOTE_FG} ${TXTNOTE_BTN}
!macroend

; Stack: next-label, cancel-label. Keep the stock MUI buttons — hiding
; them previously froze the wizard. We only restyle and move them.
!macro TxtNoteShowWizardButtons
  Exch $1
  Exch
  Exch $2
  GetDlgItem $0 $HWNDPARENT 1
  ShowWindow $0 ${SW_SHOW}
  EnableWindow $0 1
  SendMessage $0 ${WM_SETTEXT} 0 "STR:$2"
  GetDlgItem $0 $HWNDPARENT 2
  ShowWindow $0 ${SW_SHOW}
  EnableWindow $0 1
  SendMessage $0 ${WM_SETTEXT} 0 "STR:$1"
  GetDlgItem $0 $HWNDPARENT 3
  ShowWindow $0 ${SW_HIDE}
  Pop $2
  Pop $1
  !insertmacro TxtNoteApplyDarkChrome
!macroend

Function ApplyDarkChrome
  !insertmacro TxtNoteApplyDarkChrome
FunctionEnd
Function un.ApplyDarkChrome
  !insertmacro TxtNoteApplyDarkChrome
FunctionEnd

Function ShowWizardButtons
  !insertmacro TxtNoteShowWizardButtons
FunctionEnd
Function un.ShowWizardButtons
  !insertmacro TxtNoteShowWizardButtons
FunctionEnd

Function TxtNoteOnGUIInit
  CreateFont $TxtNoteCaptionFont "Segoe UI" 8 600
  CreateFont $TxtNoteTitleFont "Segoe UI" 20 700
  CreateFont $TxtNoteBodyFont "Segoe UI" 10 400
  CreateFont $TxtNoteBtnFont "Segoe UI" 9 600
  StrCpy $0 "${TXTNOTE_INSTALLER_BUILD}"
  Call ApplyDarkChrome
FunctionEnd

Function un.TxtNoteOnGUIInit
  CreateFont $TxtNoteCaptionFont "Segoe UI" 8 600
  CreateFont $TxtNoteTitleFont "Segoe UI" 20 700
  CreateFont $TxtNoteBodyFont "Segoe UI" 10 400
  CreateFont $TxtNoteBtnFont "Segoe UI" 9 600
  StrCpy $0 "${TXTNOTE_INSTALLER_BUILD}"
  Call un.ApplyDarkChrome
FunctionEnd

Function OnBrowseInstallDir
  ${NSD_GetText} $TxtNoteDirRequest $0
  nsDialogs::SelectFolderDialog "Kurulum konumu" $0
  Pop $0
  ${If} $0 != "error"
    ${If} $0 != ""
      ${NSD_SetText} $TxtNoteDirRequest $0
    ${EndIf}
  ${EndIf}
FunctionEnd

Function OnToggleDesktopShortcut
  ${NSD_GetState} $TxtNoteCheckbox $0
  ${If} $0 == ${BST_CHECKED}
    ${NSD_SetState} $TxtNoteCheckbox ${BST_UNCHECKED}
  ${Else}
    ${NSD_SetState} $TxtNoteCheckbox ${BST_CHECKED}
  ${EndIf}
FunctionEnd

Function un.OnToggleDeleteAppData
  ${NSD_GetState} $DeleteAppDataCheckbox $0
  ${If} $0 == ${BST_CHECKED}
    ${NSD_SetState} $DeleteAppDataCheckbox ${BST_UNCHECKED}
  ${Else}
    ${NSD_SetState} $DeleteAppDataCheckbox ${BST_CHECKED}
  ${EndIf}
FunctionEnd

Function PageSetup
  ${If} $PassiveMode = 1
    Abort
  ${EndIf}
  ${If} $MaintenanceMode = 1
    Abort
  ${EndIf}

  nsDialogs::Create 1018
  Pop $TxtNoteDialog
  ${If} $TxtNoteDialog == error
    Abort
  ${EndIf}
  ${IfThen} $(^RTL) = 1 ${|} nsDialogs::SetRTL $(^RTL) ${|}

  Call ApplyDarkChrome
  Push "Y${U+00FC}kle"
  Push "${U+0130}ptal"
  Call ShowWizardButtons
  SetCtlColors $TxtNoteDialog ${TXTNOTE_FG} ${TXTNOTE_BG}

  ${NSD_CreateIcon} 20u 12u 16u 16u "$PLUGINSDIR\setup.ico"
  Pop $0

  ${NSD_CreateLabel} 50u 14u 230u 12u "TxtNote"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
  SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

  ${NSD_CreateLabel} 20u 36u 280u 18u "Kuruluma haz${U+0131}r"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteTitleFont 1
  SetCtlColors $0 ${TXTNOTE_FG} ${TXTNOTE_BG}

  ${NSD_CreateLabel} 20u 64u 80u 10u "Konum"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
  SetCtlColors $0 ${TXTNOTE_FG} ${TXTNOTE_BG}

  ${NSD_CreateLabel} 52u 64u 80u 10u "${U+00B7}  Kurulum"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
  SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

  ${NSD_CreateLabel} 8% 82u 84% 10u "Kurulum konumu"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
  SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

  ${NSD_CreateText} 8% 94u 60% 14u "$INSTDIR"
  Pop $TxtNoteDirRequest
  SendMessage $TxtNoteDirRequest ${WM_SETFONT} $TxtNoteBodyFont 1
  SetCtlColors $TxtNoteDirRequest ${TXTNOTE_FG} ${TXTNOTE_FIELD}
  EnableWindow $TxtNoteDirRequest 1
  ${NSD_SetText} $TxtNoteDirRequest $INSTDIR

  ${NSD_CreateButton} 70% 93u 22% 16u "De${U+011F}i${U+015F}tir"
  Pop $TxtNoteBrowseBtn
  ${NSD_OnClick} $TxtNoteBrowseBtn OnBrowseInstallDir
  EnableWindow $TxtNoteBrowseBtn 1

  ; Themed checkboxes hide their caption on a dark background. Keep the
  ; box themeless and put the label on a separate control.
  ${NSD_CreateCheckbox} 8% 118u 14u 14u ""
  Pop $TxtNoteCheckbox
  System::Call 'uxtheme::SetWindowTheme(p $TxtNoteCheckbox, w " ", w " ")'
  SetCtlColors $TxtNoteCheckbox ${TXTNOTE_FG} ${TXTNOTE_BG}
  ${If} $DesktopShortcut == ""
    StrCpy $DesktopShortcut ${BST_CHECKED}
  ${EndIf}
  ${NSD_SetState} $TxtNoteCheckbox $DesktopShortcut

  ${NSD_CreateLabel} 14% 119u 78% 12u "Masa${U+00FC}st${U+00FC}ne k${U+0131}sayol olu${U+015F}tur"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteBodyFont 1
  SetCtlColors $0 ${TXTNOTE_FG} ${TXTNOTE_BG}
  ${NSD_OnClick} $0 OnToggleDesktopShortcut

  nsDialogs::Show
FunctionEnd

Function PageSetupLeave
  ${NSD_GetText} $TxtNoteDirRequest $INSTDIR
  ${NSD_GetState} $TxtNoteCheckbox $DesktopShortcut
  ${If} $INSTDIR == ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "L${U+00FC}tfen bir kurulum konumu se${U+00E7}in."
    Abort
  ${EndIf}
FunctionEnd

!macro TxtNoteLayoutProgress TITLE
  FindWindow $0 "#32770" "" $HWNDPARENT
  ${If} $0 != 0
    SetCtlColors $0 ${TXTNOTE_FG} ${TXTNOTE_BG}
    System::Alloc 16
    Pop $2
    System::Call "user32::GetClientRect(p $0, p $2)"
    System::Call "*$2(i, i, i .r3, i .r4)"
    System::Free $2
    IntOp $5 $3 - 64

    ; NSIS writes extract paths into IDC 1006. Do not use that
    ; control as the page title — a 20pt label plus a long path
    ; paints over the progress bar.
    GetDlgItem $1 $0 1006
    ShowWindow $1 ${SW_HIDE}
    System::Call "user32::SetWindowPos(p $1, i 0, i 32, i -80, i r5, i 16, i 0x14)"
    SendMessage $1 ${WM_SETFONT} $TxtNoteBodyFont 1
    SetCtlColors $1 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

    ; SS_LEFTNOWORDWRAP keeps the longer uninstall title on one line
    ; so it cannot paint down into the progress bar.
    System::Call 'user32::CreateWindowEx(i 0, w "STATIC", w "${TITLE}", i 0x5000000C, i 32, i 28, i r5, i 48, p $0, p 0, p 0, p 0) p .r1'
    SendMessage $1 ${WM_SETFONT} $TxtNoteTitleFont 1
    SetCtlColors $1 ${TXTNOTE_FG} ${TXTNOTE_BG}

    GetDlgItem $1 $0 1004
    System::Call "user32::SetWindowPos(p $1, i 0, i 32, i 108, i r5, i 14, i 0x14)"
    System::Call 'uxtheme::SetWindowTheme(p $1, w " ", w " ")'
    SendMessage $1 ${PBM_SETBARCOLOR} 0 ${TXTNOTE_CTA_BG}
    SendMessage $1 ${PBM_SETBKCOLOR} 0 ${TXTNOTE_FIELD}

    GetDlgItem $1 $0 1027
    ShowWindow $1 ${SW_HIDE}
    GetDlgItem $1 $0 1016
    ShowWindow $1 ${SW_HIDE}
  ${EndIf}
!macroend

Function InstFilesShow
  Call ApplyDarkChrome
  Push "Kuruluyor"
  Push "${U+0130}ptal"
  Call ShowWizardButtons
  GetDlgItem $0 $HWNDPARENT 1
  ShowWindow $0 ${SW_HIDE}
  !insertmacro TxtNoteLayoutProgress "Kuruluyor"
FunctionEnd

Function un.InstFilesShow
  Call un.ApplyDarkChrome
  Push "Kald${U+0131}r${U+0131}l${U+0131}yor"
  Push "${U+0130}ptal"
  Call un.ShowWizardButtons
  GetDlgItem $0 $HWNDPARENT 1
  ShowWindow $0 ${SW_HIDE}
  !insertmacro TxtNoteLayoutProgress "Kald${U+0131}r${U+0131}l${U+0131}yor"
FunctionEnd

Function un.PageConfirm
  ${If} $PassiveMode = 1
    Abort
  ${EndIf}

  nsDialogs::Create 1018
  Pop $TxtNoteDialog
  ${If} $TxtNoteDialog == error
    Abort
  ${EndIf}
  ${IfThen} $(^RTL) = 1 ${|} nsDialogs::SetRTL $(^RTL) ${|}

  Call un.ApplyDarkChrome
  Push "Kald${U+0131}r"
  Push "${U+0130}ptal"
  Call un.ShowWizardButtons
  SetCtlColors $TxtNoteDialog ${TXTNOTE_FG} ${TXTNOTE_BG}

  ${NSD_CreateIcon} 20u 12u 16u 16u "$PLUGINSDIR\setup.ico"
  Pop $0

  ${NSD_CreateLabel} 50u 14u 230u 12u "TxtNote"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
  SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

  ${NSD_CreateLabel} 20u 36u 280u 18u "TxtNote'u kald${U+0131}r"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteTitleFont 1
  SetCtlColors $0 ${TXTNOTE_FG} ${TXTNOTE_BG}

  ${NSD_CreateLabel} 20u 58u 280u 28u "Uygulama ve k${U+0131}sayollar${U+0131} bu cihazdan silinecek. Notlar${U+0131}n${U+0131}z varsay${U+0131}lan olarak korunur."
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteBodyFont 1
  SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

  ; Do not draw a surface card behind the checkbox — the empty
  ; STATIC ate clicks the same way the old path overlay did.
  ${NSD_CreateLabel} 8% 96u 84% 10u "Silme se${U+00E7}enekleri"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
  SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

  ${NSD_CreateCheckbox} 8% 112u 14u 14u ""
  Pop $DeleteAppDataCheckbox
  System::Call 'uxtheme::SetWindowTheme(p $DeleteAppDataCheckbox, w " ", w " ")'
  SetCtlColors $DeleteAppDataCheckbox ${TXTNOTE_FG} ${TXTNOTE_BG}
  EnableWindow $DeleteAppDataCheckbox 1
  ${If} $DeleteAppDataCheckboxState == ${BST_CHECKED}
    ${NSD_SetState} $DeleteAppDataCheckbox ${BST_CHECKED}
  ${EndIf}

  ${NSD_CreateLabel} 14% 113u 78% 12u "Notlar${U+0131}m${U+0131} ve uygulama ayarlar${U+0131}m${U+0131} da sil"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteBodyFont 1
  SetCtlColors $0 ${TXTNOTE_FG} ${TXTNOTE_BG}
  ${NSD_OnClick} $0 un.OnToggleDeleteAppData

  ${NSD_CreateLabel} 14% 126u 78% 12u "Kal${U+0131}c${U+0131}d${U+0131}r ve geri al${U+0131}namaz."
  Pop $0
  SendMessage $0 ${WM_SETFONT} $TxtNoteCaptionFont 1
  SetCtlColors $0 ${TXTNOTE_MUTED} ${TXTNOTE_BG}

  nsDialogs::Show
FunctionEnd

Function un.PageConfirmLeave
  ${NSD_GetState} $DeleteAppDataCheckbox $DeleteAppDataCheckboxState
FunctionEnd


Function CreateOrUpdateStartMenuShortcut
 ; We used to use product name as MAINBINARYNAME
 ; migrate old shortcuts to target the new MAINBINARYNAME
 StrCpy $R0 0

 !insertmacro IsShortcutTarget "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk" "$INSTDIR\$OldMainBinaryName"
 Pop $0
 ${If} $0 = 1
 !insertmacro SetShortcutTarget "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
 StrCpy $R0 1
 ${EndIf}

 !insertmacro IsShortcutTarget "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\$OldMainBinaryName"
 Pop $0
 ${If} $0 = 1
 !insertmacro SetShortcutTarget "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
 StrCpy $R0 1
 ${EndIf}

 ${If} $R0 = 1
 Return
 ${EndIf}

 ; Skip creating shortcut if in update mode or no shortcut mode
 ; but always create if migrating from wix
 ${If} $WixMode = 0
 ${If} $UpdateMode = 1
 ${OrIf} $NoShortcutMode = 1
 Return
 ${EndIf}
 ${EndIf}

 !if "${STARTMENUFOLDER}" != ""
 CreateDirectory "$SMPROGRAMS\$AppStartMenuFolder"
 CreateShortcut "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\txtnote.ico" 0
 !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\$AppStartMenuFolder\${PRODUCTNAME}.lnk"
 !else
 CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\txtnote.ico" 0
 !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\${PRODUCTNAME}.lnk"
 !endif
FunctionEnd

Function CreateOrUpdateDesktopShortcut
 ; We used to use product name as MAINBINARYNAME
 ; migrate old shortcuts to target the new MAINBINARYNAME
 !insertmacro IsShortcutTarget "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\$OldMainBinaryName"
 Pop $0
 ${If} $0 = 1
 !insertmacro SetShortcutTarget "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
 Return
 ${EndIf}

 ; Skip creating shortcut if in update mode or no shortcut mode
 ; but always create if migrating from wix
 ${If} $WixMode = 0
 ${If} $UpdateMode = 1
 ${OrIf} $NoShortcutMode = 1
 Return
 ${EndIf}
 ${EndIf}

 CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\txtnote.ico" 0
 !insertmacro SetLnkAppUserModelId "$DESKTOP\${PRODUCTNAME}.lnk"
FunctionEnd
