
-- this function is called when the box is initialized
function initialize(box)

	dofile(box:get_config("${Path_Data}") .. "/plugins/stimulation/lua-stimulator-stim-codes.lua")

	stim = _G[box:get_setting(2)]
	launchTime = box:get_setting(3)
	
end

-- this function is called when the box is uninitialized
function uninitialize(box)
end

-- this function is called once by the box
function process(box)

	box:send_stimulation(1, stim, launchTime, 0)

end
