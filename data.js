// =============================================
//  Kuwerty SCRIPTS — DATA STORE
//  แก้ไขข้อมูล script ของคุณที่นี่ได้เลย
// =============================================

const SCRIPTS_DATA = [
  {
    id: 1,
    name: "Universal ESP & Aimbot",
    game: "All Games",
    tag: "universal",
    status: "working",
    desc: "ESP และ Aimbot สำหรับทุกเกม — เห็นศัตรูผ่านกำแพง, lock-on ศัตรูอัตโนมัติ",
    features: ["Player ESP", "Box ESP", "Distance ESP", "Aimbot", "FOV Circle", "Smooth Aim"],
    image: "",   // ใส่ URL รูปภาพ thumbnail
    video: "",   // ใส่ YouTube embed URL เช่น https://www.youtube.com/embed/XXXXXXXX
    script: `-- Kuwerty Universal ESP & Aimbot
-- Works on most Roblox games
-- Updated: 2024

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local LocalPlayer = Players.LocalPlayer
local Camera = workspace.CurrentCamera

-- Config
local CONFIG = {
    ESP = {
        Enabled = true,
        BoxColor = Color3.fromRGB(230, 57, 70),
        TextColor = Color3.fromRGB(255, 255, 255),
        ShowDistance = true,
    },
    Aimbot = {
        Enabled = true,
        FOV = 150,
        Smooth = 0.3,
        Key = Enum.UserInputType.MouseButton2,
    }
}

print("[Kuwerty] Universal Script Loaded!")
-- Script continues...`
  },
  {
    id: 2,
    name: "Blox Fruits Auto Farm",
    game: "Blox Fruits",
    tag: "game-specific",
    status: "working",
    desc: "Auto Farm เลเวล, เก็บ Fruit อัตโนมัติ, Boss Farm พร้อม GUI ครบ",
    features: ["Auto Farm EXP", "Auto Collect Fruits", "Boss Farm", "Mastery Farm", "Devil Fruit Sniper", "Auto Quest"],
    image: "",
    video: "",
    script: `-- Kuwerty Blox Fruits Script
-- Version: 3.2 | Updated: 2024
-- Works with Synapse X, Fluxus, Arceus X

local GUI = Instance.new("ScreenGui")
GUI.Name = "Kuwerty_BloxFruits"
GUI.Parent = game.CoreGui
GUI.ResetOnSpawn = false

-- Auto Farm Function
local function AutoFarm(mob)
    local char = game.Players.LocalPlayer.Character
    if not char then return end
    
    local humanoid = char:FindFirstChild("Humanoid")
    if humanoid and humanoid.Health > 0 then
        -- Teleport to mob and attack
        char.HumanoidRootPart.CFrame = mob.HumanoidRootPart.CFrame * CFrame.new(0,0,-4)
        -- Attack logic here
    end
end

print("[Kuwerty] Blox Fruits Script Loaded!")`
  },
  {
    id: 3,
    name: "Murder Mystery 2 Helper",
    game: "Murder Mystery 2",
    tag: "game-specific",
    status: "working",
    desc: "เห็น Murderer และ Sheriff ผ่านกำแพง, Knife Trajectory, Auto Dodge",
    features: ["Murderer ESP", "Sheriff ESP", "Knife Trajectory", "Auto Dodge", "Coin Farm", "Role Reveal"],
    image: "",
    video: "",
    script: `-- Kuwerty MM2 Script
-- Murder Mystery 2 Helper
-- v1.8 | Fully Undetected

local function GetMurderer()
    for _, player in pairs(game.Players:GetPlayers()) do
        local char = player.Character
        if char then
            local knife = char:FindFirstChild("Knife")
            if knife then
                return player
            end
        end
    end
    return nil
end

local function ESP_Loop()
    while task.wait(0.1) do
        local murderer = GetMurderer()
        if murderer then
            -- Highlight murderer
            local highlight = Instance.new("Highlight")
            highlight.FillColor = Color3.fromRGB(230, 57, 70)
            highlight.Parent = murderer.Character
        end
    end
end

task.spawn(ESP_Loop)
print("[Kuwerty] MM2 Script Active!")`
  },
  {
    id: 4,
    name: "Speed & Fly Utility",
    game: "All Games",
    tag: "utility",
    status: "working",
    desc: "Speed hack, Fly mode, Noclip, Infinite Jump — utility รวมพร้อม keybind ปรับได้",
    features: ["Speed Hack", "Fly Mode", "Noclip", "Infinite Jump", "Anti-Gravity", "Teleport to Player"],
    image: "",
    video: "",
    script: `-- Kuwerty Utility Script
-- Speed / Fly / Noclip / Infinite Jump
-- Compatible with all executors

local UIS = game:GetService("UserInputService")
local Players = game:GetService("Players")
local LP = Players.LocalPlayer

-- Speed Hack
local SPEED = 100 -- WalkSpeed (default 16)
LP.Character.Humanoid.WalkSpeed = SPEED

-- Infinite Jump
UIS.JumpRequest:Connect(function()
    LP.Character.Humanoid:ChangeState(
        Enum.HumanoidStateType.Jumping
    )
end)

-- Fly [Press F to toggle]
local flying = false
UIS.InputBegan:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.F then
        flying = not flying
        -- Fly logic
        print("[Kuwerty] Fly:", flying)
    end
end)

print("[Kuwerty] Utility Script Loaded!")`
  }
];
