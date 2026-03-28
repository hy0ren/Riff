use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Deserialize;
use tauri::{command, AppHandle, Manager, Runtime};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportParams {
  project_id: String,
  asset_id: String,
  filename: String,
  format: String,
  contents: Option<String>,
  base64_data: Option<String>,
  mime_type: Option<String>,
}

fn open_path(path: &Path) -> Result<(), String> {
  #[cfg(target_os = "macos")]
  let mut command = {
    let mut cmd = Command::new("open");
    cmd.arg(path);
    cmd
  };

  #[cfg(target_os = "windows")]
  let mut command = {
    let mut cmd = Command::new("explorer");
    cmd.arg(path);
    cmd
  };

  #[cfg(all(unix, not(target_os = "macos")))]
  let mut command = {
    let mut cmd = Command::new("xdg-open");
    cmd.arg(path);
    cmd
  };

  command
    .spawn()
    .map_err(|error| format!("Could not open path: {error}"))?;

  Ok(())
}

fn decode_base64(input: &str) -> Result<Vec<u8>, String> {
  fn decode_char(byte: u8) -> Option<u8> {
    match byte {
      b'A'..=b'Z' => Some(byte - b'A'),
      b'a'..=b'z' => Some(byte - b'a' + 26),
      b'0'..=b'9' => Some(byte - b'0' + 52),
      b'+' => Some(62),
      b'/' => Some(63),
      _ => None,
    }
  }

  let bytes = input.as_bytes();
  if bytes.len() % 4 != 0 {
    return Err("Invalid base64 payload length.".to_string());
  }

  let mut output = Vec::with_capacity(bytes.len() / 4 * 3);
  let mut index = 0;
  while index < bytes.len() {
    let a = bytes[index];
    let b = bytes[index + 1];
    let c = bytes[index + 2];
    let d = bytes[index + 3];

    let first = decode_char(a).ok_or_else(|| "Invalid base64 payload.".to_string())?;
    let second = decode_char(b).ok_or_else(|| "Invalid base64 payload.".to_string())?;
    let third = if c == b'=' {
      0
    } else {
      decode_char(c).ok_or_else(|| "Invalid base64 payload.".to_string())?
    };
    let fourth = if d == b'=' {
      0
    } else {
      decode_char(d).ok_or_else(|| "Invalid base64 payload.".to_string())?
    };

    output.push((first << 2) | (second >> 4));
    if c != b'=' {
      output.push((second << 4) | (third >> 2));
    }
    if d != b'=' {
      output.push((third << 6) | fourth);
    }

    index += 4;
  }

  Ok(output)
}

fn export_dir<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
  let dir = app
    .path()
    .app_data_dir()
    .map_err(|error| format!("Could not resolve app data dir: {error}"))?
    .join("exports");

  fs::create_dir_all(&dir).map_err(|error| format!("Could not create export dir: {error}"))?;
  Ok(dir)
}

#[command]
fn reveal_path(path: String) -> Result<(), String> {
  open_path(Path::new(&path))
}

#[command]
fn open_export_dir<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
  let dir = export_dir(&app)?;
  open_path(&dir)?;
  Ok(dir.to_string_lossy().to_string())
}

#[command]
fn export_asset<R: Runtime>(app: AppHandle<R>, params: ExportParams) -> Result<String, String> {
  let dir = export_dir(&app)?.join(&params.project_id);
  fs::create_dir_all(&dir)
    .map_err(|error| format!("Could not create project export dir: {error}"))?;

  let extension = params.format.to_lowercase();
  let filename = if params.filename.to_lowercase().ends_with(&format!(".{extension}")) {
    params.filename.clone()
  } else {
    format!("{}.{}", params.filename, extension)
  };
  let path = dir.join(filename);

  if let Some(base64_data) = params.base64_data {
    let bytes = decode_base64(&base64_data)?;
    fs::write(&path, bytes).map_err(|error| format!("Could not write export file: {error}"))?;
  } else {
    let contents = params.contents.unwrap_or_else(|| {
      format!(
        "Riff export\nproject_id={}\nasset_id={}\nformat={}\nmime_type={}\n",
        params.project_id,
        params.asset_id,
        params.format,
        params.mime_type.unwrap_or_else(|| "text/plain".to_string())
      )
    });
    fs::write(&path, contents).map_err(|error| format!("Could not write export file: {error}"))?;
  }

  Ok(path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![reveal_path, open_export_dir, export_asset])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
