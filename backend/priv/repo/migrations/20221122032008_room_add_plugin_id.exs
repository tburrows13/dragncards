defmodule DragnCards.Repo.Migrations.RoomAddPluginId do
  use Ecto.Migration

  def change do
    alter table(:rooms) do
      add(:plugin_id, :string)
    end
  end
end
